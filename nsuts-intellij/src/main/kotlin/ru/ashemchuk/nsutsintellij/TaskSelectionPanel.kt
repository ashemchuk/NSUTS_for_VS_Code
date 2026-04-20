package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.fileChooser.FileChooser
import com.intellij.openapi.fileChooser.FileChooserDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.ProgressManager
import com.intellij.openapi.progress.Task as ProgressTask
import com.intellij.openapi.ui.ComboBox
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.panels.VerticalLayout
import com.intellij.util.ui.JBUI
import kotlinx.coroutines.runBlocking
import ru.ashemchuk.nsutsintellij.api.ApiClient
import ru.ashemchuk.nsutsintellij.api.Task
import ru.ashemchuk.nsutsintellij.storage.StateRepository
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.swing.BoxLayout
import javax.swing.JButton
import javax.swing.JList
import javax.swing.JOptionPane
import javax.swing.ListSelectionModel
import javax.swing.SwingConstants

class TaskSelectionPanel(private val project: Project, private val apiClient: ApiClient) {
    private val logger = Logger.getInstance(TaskSelectionPanel::class.java)
    private var selectedTask: Task? = null
    private var selectedFiles = mutableListOf<VirtualFile>()
    private var selectedCompiler: String? = null
    private var compilerMap = mapOf<String, String>() // title -> id
    private var savedContext: ru.ashemchuk.nsutsintellij.api.TaskContext? = null
    
    private val content = JBPanel<JBPanel<*>>(VerticalLayout(JBUI.scale(10))).apply {
        border = JBUI.Borders.empty(20, 15, 15, 15)
    }
    
    private val taskLabel = JBLabel("No task selected").apply {
        font = com.intellij.util.ui.JBFont.h2()
        horizontalAlignment = SwingConstants.CENTER
    }
    
    private val fileList = JList<String>().apply {
        selectionMode = ListSelectionModel.SINGLE_SELECTION
        visibleRowCount = 5
    }
    
    private val compilerComboBox = ComboBox<String>().apply {
        addActionListener {
            selectedCompiler = selectedItem as? String
            saveTaskContext()
        }
    }
    
    private val addFileButton = JButton("Add File").apply {
        addActionListener {
            val descriptor = FileChooserDescriptor(true, false, false, false, false, true)
                .withTitle("Select Source Files")
                .withDescription("Select source files to submit")
            
            FileChooser.chooseFiles(descriptor, project, null)?.let { files ->
                logger.warn("Adding files: ${files.map { it.name }}")
                selectedFiles.addAll(files)
                updateFileList()
                saveTaskContext()
            }
        }
    }
    
    private val removeFileButton = JButton("Remove Selected").apply {
        addActionListener {
            val selectedIndex = fileList.selectedIndex
            if (selectedIndex != -1) {
                selectedFiles.removeAt(selectedIndex)
                updateFileList()
                saveTaskContext()
            }
        }
    }
    
    private val submitButton = JButton("Submit Solution").apply {
        addActionListener {
            submitSolution()
        }
    }
    
    init {
        setupUI()
        loadCompilers()
        loadState()
    }
    
    private fun setupUI() {
        content.add(taskLabel)
        
        // File selection section
        content.add(JBLabel("Selected Files:"))
        content.add(JBScrollPane(fileList))
        
        val fileButtonPanel = JBPanel<JBPanel<*>>().apply {
            layout = BoxLayout(this, BoxLayout.X_AXIS)
            add(addFileButton)
            add(removeFileButton)
        }
        content.add(fileButtonPanel)
        
        // Compiler selection section
        content.add(JBLabel("Compiler:"))
        content.add(compilerComboBox)
        
        // Submit button
        content.add(submitButton)
    }
    
    fun getContent(): JBPanel<JBPanel<*>> = content
    
    fun setTask(task: Task) {
        logger.info("Setting task: ${task.id}, savedContext taskId=${savedContext?.taskId}")
        selectedTask = task
        taskLabel.text = "Task: ${task.title}"
        selectedFiles.clear()
        
        var filesRestored = false
        // Restore files from saved context if it matches this task
        savedContext?.let { context ->
            if (context.taskId == task.id) {
                logger.info("Restoring files for task ${task.id}: ${context.files}")
                val localFileSystem = com.intellij.openapi.vfs.LocalFileSystem.getInstance()
                context.files.forEach { path ->
                    val file = localFileSystem.findFileByPath(path)
                    if (file != null) {
                        selectedFiles.add(file)
                        logger.info("Restored file: $path")
                    } else {
                        logger.warn("File not found: $path")
                    }
                }
                filesRestored = true
            } else {
                logger.info("Saved context taskId mismatch (${context.taskId} != ${task.id}), skipping file restoration")
            }
        }
        
        updateFileList()
        // Save active task immediately
        saveActiveTask()
        // Save context only if files were not restored (i.e., we switched to a different task)
        if (!filesRestored) {
            logger.info("Files not restored, saving empty context for task ${task.id}")
            saveTaskContext()
        } else {
            logger.info("Files restored, skipping context save to preserve files")
        }
        loadCompilersForTask(task)
    }
    
    private fun updateFileList() {
        val fileNames = selectedFiles.map { it.name }
        fileList.setListData(fileNames.toTypedArray())
    }
    
    private fun loadCompilers() {
        // This is called on init, but we can't load compilers without a task
        // So we'll just clear the combo box
        compilerComboBox.removeAllItems()
        compilerMap = emptyMap()
        selectedCompiler = null
    }
    
    private fun loadCompilersForTask(task: Task) {
        runBlocking {
            try {
                // First enter the tour to set the context
                apiClient.enterTour(task.tourId.toInt())
                
                // Then get the submit info which contains the compilers
                val submitInfo = apiClient.getSubmitInfo()
                val compilers = submitInfo?.langs ?: emptyList()
                compilerMap = compilers.associate { it.title to it.id }
                
                compilerComboBox.removeAllItems()
                compilers.forEach { compilerComboBox.addItem(it.title) }
                if (compilers.isNotEmpty()) {
                    // Try to restore saved compiler selection
                    val savedCompiler = selectedCompiler
                    if (savedCompiler != null && compilerMap.containsKey(savedCompiler)) {
                        compilerComboBox.selectedItem = savedCompiler
                    } else {
                        selectedCompiler = compilers.first().title
                        compilerComboBox.selectedItem = selectedCompiler
                    }
                } else {
                    JOptionPane.showMessageDialog(
                        content,
                        "No compilers available for this task",
                        "Warning",
                        JOptionPane.WARNING_MESSAGE
                    )
                }
                // Save active task
                saveActiveTask()
                // Save context with updated compiler selection
                saveTaskContext()
            } catch (e: Exception) {
                e.printStackTrace()
                JOptionPane.showMessageDialog(
                    content,
                    "Failed to load compilers: ${e.message}",
                    "Error",
                    JOptionPane.ERROR_MESSAGE
                )
            }
        }
    }
    
    private fun saveActiveTask() {
        selectedTask?.let { task ->
            val activeTask = ru.ashemchuk.nsutsintellij.api.ActiveTask(task.id, task.title, task.tourId, task.olympiadId)
            StateRepository.saveActiveTask(activeTask)
        } ?: StateRepository.saveActiveTask(null)
    }
    
    private fun saveTaskContext() {
        val filePaths = selectedFiles.map { it.path }
        val context = ru.ashemchuk.nsutsintellij.api.TaskContext(
            taskId = selectedTask?.id,
            files = filePaths,
            compiler = selectedCompiler
        )
        logger.warn("Saving task context: taskId=${context.taskId}, files=${context.files}")
        StateRepository.saveTaskContext(context)
    }
    
    private fun loadState() {
        savedContext = StateRepository.loadTaskContext()
        logger.warn("Loaded saved context: taskId=${savedContext?.taskId}, files=${savedContext?.files}, compiler=${savedContext?.compiler}")
        savedContext?.let {
            selectedCompiler = it.compiler
        }
        // Active task restoration is handled by the tree view
    }
    
    private fun submitSolution() {
        val task = selectedTask
        if (task == null) {
            JOptionPane.showMessageDialog(
                content,
                "Please select a task first",
                "Error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }
        
        if (selectedFiles.isEmpty()) {
            JOptionPane.showMessageDialog(
                content,
                "Please select at least one file to submit",
                "Error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }
        
        val compilerTitle = selectedCompiler
        if (compilerTitle == null) {
            JOptionPane.showMessageDialog(
                content,
                "Please select a compiler",
                "Error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }
        
        val compilerId = compilerMap[compilerTitle]
        if (compilerId == null) {
            JOptionPane.showMessageDialog(
                content,
                "Invalid compiler selected",
                "Error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }
        
        // Determine submission method
        val sourceText: String?
        val sourceFile: ByteArray?
        
        if (selectedFiles.size == 1) {
            // Try to read as text
            val file = selectedFiles.first()
            val text = readFileAsText(file)
            if (text != null) {
                sourceText = text
                sourceFile = null
            } else {
                // Fallback to ZIP (single file inside)
                sourceText = null
                sourceFile = createZipFromFiles()
            }
        } else {
            // Multiple files -> ZIP
            sourceText = null
            sourceFile = createZipFromFiles()
        }
        
        runBlocking {
            try {
                val success = apiClient.submitSolution(
                    taskId = task.id,
                    langId = compilerId,
                    sourceText = sourceText,
                    sourceFile = sourceFile
                )
                
                if (success) {
                    // Show initial success message
                    JOptionPane.showMessageDialog(
                        content,
                        "Solution submitted successfully! Waiting for results...",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE
                    )
                    // Start polling in background
                    startPolling(task)
                } else {
                    JOptionPane.showMessageDialog(
                        content,
                        "Failed to submit solution. Please try again.",
                        "Error",
                        JOptionPane.ERROR_MESSAGE
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
                JOptionPane.showMessageDialog(
                    content,
                    "Error submitting solution: ${e.message}",
                    "Error",
                    JOptionPane.ERROR_MESSAGE
                )
            }
        }
    }
    
    private fun startPolling(task: Task) {
        ProgressManager.getInstance().run(object : ProgressTask.Backgroundable(project, "Waiting for results", true) {
            override fun run(indicator: ProgressIndicator) {
                indicator.isIndeterminate = true
                indicator.text = "Polling submission result..."
                
                runBlocking {
                    try {
                        val report = apiClient.pollSubmissionResult(task.id, task.olympiadId, task.tourId)
                        if (report != null) {
                            // Show result
                            val message = when (report.status) {
                                ru.ashemchuk.nsutsintellij.api.ReportStatus.Successful ->
                                    "Solution passed! ${report.result_line}"
                                ru.ashemchuk.nsutsintellij.api.ReportStatus.Unsuccessful ->
                                    "Solution failed. ${report.result_line}"
                                else ->
                                    "Unexpected status: ${report.status}"
                            }
                            JOptionPane.showMessageDialog(
                                content,
                                message,
                                "Result",
                                JOptionPane.INFORMATION_MESSAGE
                            )
                        } else {
                            JOptionPane.showMessageDialog(
                                content,
                                "Timeout waiting for result. Please check reports later.",
                                "Timeout",
                                JOptionPane.WARNING_MESSAGE
                            )
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        JOptionPane.showMessageDialog(
                            content,
                            "Error while polling: ${e.message}",
                            "Error",
                            JOptionPane.ERROR_MESSAGE
                        )
                    }
                }
            }
        })
    }

    private fun readFileAsText(file: VirtualFile): String? {
        return try {
            String(file.contentsToByteArray(), StandardCharsets.UTF_8)
        } catch (e: Exception) {
            null
        }
    }

    private fun createZipFromFiles(): ByteArray {
        ByteArrayOutputStream().use { baos ->
            ZipOutputStream(baos).use { zos ->
                selectedFiles.forEach { file ->
                    val entry = ZipEntry(file.name)
                    zos.putNextEntry(entry)
                    file.contentsToByteArray().let { zos.write(it) }
                    zos.closeEntry()
                }
            }
            return baos.toByteArray()
        }
    }
    
    fun clearSelection() {
        selectedTask = null
        taskLabel.text = "No task selected"
        selectedFiles.clear()
        updateFileList()
    }
}
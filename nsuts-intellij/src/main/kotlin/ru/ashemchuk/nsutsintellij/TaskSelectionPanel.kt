package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.fileChooser.FileChooser
import com.intellij.openapi.fileChooser.FileChooserDescriptor
import com.intellij.openapi.project.Project
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
import java.io.ByteArrayOutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.swing.BoxLayout
import javax.swing.JButton
import javax.swing.JList
import javax.swing.JOptionPane
import javax.swing.ListSelectionModel
import javax.swing.SwingConstants

class TaskSelectionPanel(private val project: Project, private val apiClient: ApiClient) {
    private var selectedTask: Task? = null
    private var selectedFiles = mutableListOf<VirtualFile>()
    private var selectedCompiler: String? = null
    private var compilerMap = mapOf<String, String>() // title -> id
    
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
        }
    }
    
    private val addFileButton = JButton("Add File").apply {
        addActionListener {
            val descriptor = FileChooserDescriptor(true, false, false, false, false, true)
                .withTitle("Select Source Files")
                .withDescription("Select source files to submit")
            
            FileChooser.chooseFiles(descriptor, project, null)?.let { files ->
                selectedFiles.addAll(files)
                updateFileList()
            }
        }
    }
    
    private val removeFileButton = JButton("Remove Selected").apply {
        addActionListener {
            val selectedIndex = fileList.selectedIndex
            if (selectedIndex != -1) {
                selectedFiles.removeAt(selectedIndex)
                updateFileList()
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
        selectedTask = task
        taskLabel.text = "Task: ${task.title}"
        selectedFiles.clear()
        updateFileList()
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
                    selectedCompiler = compilers.first().title
                    compilerComboBox.selectedItem = selectedCompiler
                } else {
                    JOptionPane.showMessageDialog(
                        content,
                        "No compilers available for this task",
                        "Warning",
                        JOptionPane.WARNING_MESSAGE
                    )
                }
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
        
        // Create ZIP file from selected files
        val zipBytes = createZipFromFiles()
        
        runBlocking {
            try {
                val success = apiClient.submitSolution(
                    taskId = task.id,
                    langId = compilerId,
                    sourceFile = zipBytes
                )
                
                if (success) {
                    JOptionPane.showMessageDialog(
                        content,
                        "Solution submitted successfully!",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE
                    )
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
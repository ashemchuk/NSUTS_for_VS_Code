package ru.ashemchuk.nsutsintellij

import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.panels.VerticalLayout
import com.intellij.ui.table.JBTable
import com.intellij.util.ui.JBUI
import kotlinx.coroutines.runBlocking
import ru.ashemchuk.nsutsintellij.api.ApiClient
import ru.ashemchuk.nsutsintellij.api.Report
import ru.ashemchuk.nsutsintellij.api.Task
import java.awt.BorderLayout
import javax.swing.JButton
import javax.swing.JOptionPane
import javax.swing.JPanel
import javax.swing.JTabbedPane
import javax.swing.SwingConstants
import javax.swing.table.DefaultTableModel

class ReportsPanel(private val apiClient: ApiClient) {
    private var selectedTask: Task? = null
    private var reports = listOf<Report>()
    
    private val content = JBPanel<JBPanel<*>>(VerticalLayout(JBUI.scale(10))).apply {
        border = JBUI.Borders.empty(20, 15, 15, 15)
    }
    
    private val taskLabel = JBLabel("No task selected").apply {
        font = com.intellij.util.ui.JBFont.h2()
        horizontalAlignment = SwingConstants.CENTER
    }
    
    private val refreshButton = JButton("Refresh Reports").apply {
        addActionListener {
            loadReports()
        }
    }
    
    private val tableModel = DefaultTableModel(
        arrayOf("Date", "Compiler", "Status", "Result", "Points"),
        0
    )
    
    private val reportsTable = JBTable(tableModel).apply {
        setShowGrid(true)
        rowHeight = 24
    }
    
    init {
        setupUI()
    }
    
    private fun setupUI() {
        content.add(taskLabel)
        
        val buttonPanel = JBPanel<JBPanel<*>>(BorderLayout()).apply {
            add(refreshButton, BorderLayout.EAST)
        }
        content.add(buttonPanel)
        
        content.add(JBLabel("Submission Reports:"))
        content.add(JBScrollPane(reportsTable))
    }
    
    fun getContent(): JBPanel<JBPanel<*>> = content
    
    fun setTask(task: Task) {
        selectedTask = task
        taskLabel.text = "Reports for: ${task.title}"
        loadReports()
    }
    
    private fun loadReports() {
        val task = selectedTask ?: return
        
        runBlocking {
            try {
                val reportsList = apiClient.getReports(task.id)
                reports = reportsList ?: emptyList()
                updateTable()
            } catch (e: Exception) {
                e.printStackTrace()
                JOptionPane.showMessageDialog(
                    content,
                    "Failed to load reports: ${e.message}",
                    "Error",
                    JOptionPane.ERROR_MESSAGE
                )
            }
        }
    }
    
    private fun updateTable() {
        tableModel.rowCount = 0
        
        reports.forEach { report ->
            val points = if (report.points != null && report.total != null) {
                "${report.points}/${report.total}"
            } else {
                ""
            }
            
            tableModel.addRow(arrayOf(
                report.date,
                report.compiler,
                report.status.toString(),
                report.result_line,
                points
            ))
        }
    }
    
    fun clearSelection() {
        selectedTask = null
        taskLabel.text = "No task selected"
        reports = emptyList()
        updateTable()
    }
    
    fun refreshIfTaskSelected() {
        if (selectedTask != null) {
            loadReports()
        }
    }
}
package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.panels.HorizontalLayout
import com.intellij.ui.components.panels.VerticalLayout
import com.intellij.ui.content.ContentFactory
import com.intellij.util.ui.JBFont
import com.intellij.util.ui.JBUI
import kotlinx.coroutines.runBlocking
import ru.ashemchuk.nsutsintellij.api.ApiClient
import ru.ashemchuk.nsutsintellij.api.Task
import ru.ashemchuk.nsutsintellij.api.TaskTreeModel
import ru.ashemchuk.nsutsintellij.api.TaskTreeCellRenderer
import ru.ashemchuk.nsutsintellij.storage.StateRepository
import javax.swing.JButton
import javax.swing.JSplitPane
import javax.swing.JTabbedPane
import javax.swing.JTree
import javax.swing.SwingConstants
import javax.swing.event.TreeSelectionEvent
import javax.swing.event.TreeSelectionListener

class NsutsToolWindowFactory : ToolWindowFactory {
    private val logger = Logger.getInstance(NsutsToolWindowFactory::class.java)
    private val apiClient = ApiClient()

    override fun shouldBeAvailable(project: Project) = true

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val myToolWindow = MyToolWindow(project, apiClient)
        val content =
            ContentFactory.getInstance().createContent(myToolWindow.getContent(), null, false)
        toolWindow.contentManager.addContent(content)
    }

    class MyToolWindow(private val project: Project, private val apiClient: ApiClient) {
        private val logger = Logger.getInstance(MyToolWindow::class.java)
        private val taskTreeModel = TaskTreeModel(apiClient)
        private val taskTree = JTree(taskTreeModel).apply {
            isRootVisible = false
            cellRenderer = TaskTreeCellRenderer()
        }
        
        private val taskSelectionPanel = TaskSelectionPanel(project, apiClient)
        private val reportsPanel = ReportsPanel(apiClient)
        private var activeTask: Task? = null

        private val content = JBPanel<JBPanel<*>>(VerticalLayout(JBUI.scale(10))).apply {
            border = JBUI.Borders.empty(20, 15, 15, 15)
        }

        init {
            loadActiveTask()
            updateContent()
            setupTreeSelectionListener()
        }

        private fun loadActiveTask() {
            val activeTaskData = StateRepository.loadActiveTask()
            activeTask = activeTaskData?.let { data ->
                Task(data.taskId, data.name, data.olympiadId, data.tourId)
            }
        }

        private fun updateContent() {
            content.removeAll()
            if (apiClient.isAuthenticated()) {
                showAuthenticatedView()
            } else {
                showUnauthenticatedView()
            }
            content.revalidate()
            content.repaint()
        }

        private fun showUnauthenticatedView() {
            val titleLabel = JBLabel("Welcome to NSUTS").apply {
                font = JBFont.h2()
                horizontalAlignment = SwingConstants.CENTER
            }

            val descriptionLabel = JBLabel("To get started, log in to NSUTS using your credentials").apply {
                font = JBFont.regular()
                horizontalAlignment = SwingConstants.CENTER
            }

            val authButton = JButton("Authenticate").apply {
                addActionListener {
                    val authDialog = AuthDialog()
                    if (authDialog.showAndGet()) {
                        logger.info("Successfully authenticated")
                        updateContent()
                    }
                }
            }

            content.add(titleLabel)
            content.add(descriptionLabel)
            content.add(JBPanel<JBPanel<*>>().apply {
                add(authButton)
            })
        }

        private fun showAuthenticatedView() {
            val titleLabel = JBLabel("NSUTS Tasks").apply {
                font = JBFont.h2()
                horizontalAlignment = SwingConstants.CENTER
            }

            val logoutButton = JButton("Logout").apply {
                addActionListener {
                    runBlocking {
                        apiClient.logout()
                    }
                    updateContent()
                }
            }

            val refreshButton = JButton("Refresh").apply {
                addActionListener {
                    taskTreeModel.refresh()
                    taskSelectionPanel.clearSelection()
                    reportsPanel.clearSelection()
                }
            }

            val buttonPanel = JBPanel<JBPanel<*>>(HorizontalLayout(JBUI.scale(10))).apply {
                add(logoutButton)
                add(refreshButton)
            }

            // Create tabbed pane for task selection and reports
            val tabbedPane = JTabbedPane().apply {
                addTab("Submit Solution", taskSelectionPanel.getContent())
                addTab("View Reports", reportsPanel.getContent())
                addChangeListener { e ->
                    if (selectedIndex == 1) { // "View Reports" tab index
                        reportsPanel.refreshIfTaskSelected()
                    }
                }
            }

            // Create split pane for tree and tabs
            val splitPane = JSplitPane(
                JSplitPane.HORIZONTAL_SPLIT,
                JBScrollPane(taskTree),
                tabbedPane
            ).apply {
                dividerLocation = 300
                resizeWeight = 0.5
            }

            content.add(titleLabel)
            content.add(splitPane)
            content.add(buttonPanel)
            
            // Restore active task if any
            restoreActiveTask()
        }
        
        private fun restoreActiveTask() {
            activeTask?.let { task ->
                taskSelectionPanel.setTask(task)
                reportsPanel.setTask(task)
                // TODO: select task in tree (requires tree to be loaded)
            }
        }
        
        private fun setupTreeSelectionListener() {
            taskTree.addTreeSelectionListener { e: TreeSelectionEvent ->
                val path = e.newLeadSelectionPath
                if (path != null) {
                    val node = path.lastPathComponent
                    if (node is Task) {
                        taskSelectionPanel.setTask(node)
                        reportsPanel.setTask(node)
                    } else {
                        taskSelectionPanel.clearSelection()
                        reportsPanel.clearSelection()
                    }
                } else {
                    taskSelectionPanel.clearSelection()
                    reportsPanel.clearSelection()
                }
            }
        }

        fun getContent(): JBPanel<JBPanel<*>> = content
    }
}
package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.panels.VerticalLayout
import com.intellij.ui.content.ContentFactory
import com.intellij.util.ui.JBFont
import com.intellij.util.ui.JBUI
import kotlinx.coroutines.runBlocking
import ru.ashemchuk.nsutsintellij.api.ApiClient
import ru.ashemchuk.nsutsintellij.api.TaskTreeModel
import ru.ashemchuk.nsutsintellij.api.TaskTreeCellRenderer
import javax.swing.JButton
import javax.swing.JTree
import javax.swing.SwingConstants
import javax.swing.tree.DefaultTreeModel

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

        private val content = JBPanel<JBPanel<*>>(VerticalLayout(JBUI.scale(10))).apply {
            border = JBUI.Borders.empty(20, 15, 15, 15)
        }

        init {
            updateContent()
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
                }
            }

            content.add(titleLabel)
            content.add(JBScrollPane(taskTree))
            content.add(JBPanel<JBPanel<*>>().apply {
                add(logoutButton)
                add(refreshButton)
            })
        }

        fun getContent(): JBPanel<JBPanel<*>> = content
    }
}
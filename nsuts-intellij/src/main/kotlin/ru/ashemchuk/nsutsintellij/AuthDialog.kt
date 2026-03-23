package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.ui.DialogWrapper
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPasswordField
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import kotlinx.coroutines.runBlocking
import ru.ashemchuk.nsutsintellij.api.ApiClient
import java.awt.Dimension
import javax.swing.JComponent

class AuthDialog : DialogWrapper(null) {
    private val logger = Logger.getInstance(AuthDialog::class.java)
    private val apiClient = ApiClient()

    private val loginField = JBTextField()
    private val passwordField = JBPasswordField()

    init {
        title = "Authentication"
        init()
    }

    override fun createCenterPanel(): JComponent {
        return FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Login:"), loginField)
            .addLabeledComponent(JBLabel("Password:"), passwordField)
            .panel
    }

    override fun doOKAction() {
        val login = loginField.text
        val password = String(passwordField.password)

        logger.info("Auth dialog submitted - Login: $login")

        if (login.isBlank() || password.isBlank()) {
            showError("Login and password cannot be empty")
            return
        }

        // Perform authentication synchronously (blocking)
        val success = runBlocking {
            try {
                apiClient.login(login, password)
            } catch (e: Exception) {
                logger.error("Login failed", e)
                false
            }
        }

        if (success) {
            logger.info("Authentication successful for $login")
            super.doOKAction()
        } else {
            showError("Login failed. Check your credentials.")
        }
    }

    private fun showError(message: String) {
        setErrorText(message)
    }

    override fun getPreferredFocusedComponent(): JComponent? {
        return loginField
    }
}
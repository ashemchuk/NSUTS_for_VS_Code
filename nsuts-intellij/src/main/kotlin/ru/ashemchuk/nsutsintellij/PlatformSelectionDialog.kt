package ru.ashemchuk.nsutsintellij

import com.intellij.openapi.ui.DialogWrapper
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import ru.ashemchuk.nsutsintellij.config.PlatformConfig
import ru.ashemchuk.nsutsintellij.config.PlatformEntry
import java.awt.Dimension
import javax.swing.JComboBox
import javax.swing.JComponent
import javax.swing.JPanel

class PlatformSelectionDialog : DialogWrapper(null) {
    private val platformComboBox = JComboBox<PlatformEntry>()
    private val customUrlField = JBTextField()

    init {
        title = "Select NSUTS Platform"
        init()
        populateComboBox()
        updateCustomUrlVisibility()
    }

    private fun populateComboBox() {
        PlatformConfig.predefinedUrls.forEach { platformComboBox.addItem(it) }
        // Select current platform
        val currentUrl = PlatformConfig.getBaseUrl()
        val currentEntry = PlatformConfig.predefinedUrls.find { it.url == currentUrl }
        if (currentEntry != null) {
            platformComboBox.selectedItem = currentEntry
        } else {
            // Custom URL
            val customEntry = PlatformEntry("Custom", currentUrl, currentUrl)
            platformComboBox.addItem(customEntry)
            platformComboBox.selectedItem = customEntry
            customUrlField.text = currentUrl
        }
    }

    private fun updateCustomUrlVisibility() {
        val selected = platformComboBox.selectedItem as? PlatformEntry
        val isCustom = selected?.url == null
        customUrlField.isVisible = isCustom
        customUrlField.isEnabled = isCustom
    }

    override fun createCenterPanel(): JComponent {
        platformComboBox.addActionListener { updateCustomUrlVisibility() }

        val formPanel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Platform:"), platformComboBox)
            .addLabeledComponent(JBLabel("Custom URL:"), customUrlField)
            .panel

        customUrlField.toolTipText = "Enter the base URL of NSUTS API (e.g., https://example.com/nsuts-new/api/)"

        val panel = JPanel()
        panel.preferredSize = Dimension(400, 150)
        panel.add(formPanel)
        return panel
    }

    override fun doOKAction() {
        val selected = platformComboBox.selectedItem as? PlatformEntry
        val newUrl = when {
            selected?.url != null -> selected.url
            else -> customUrlField.text.trim()
        }

        if (newUrl.isBlank()) {
            setErrorText("URL cannot be empty")
            return
        }

        // Validate URL format
        try {
            java.net.URL(newUrl)
        } catch (e: Exception) {
            setErrorText("Please enter a valid URL")
            return
        }

        val oldUrl = PlatformConfig.getBaseUrl()
        if (newUrl != oldUrl) {
            PlatformConfig.setBaseUrl(newUrl)
            // Optionally clear credentials for old host? Keep them.
            // Show a message that platform changed and some features may require re-authentication.
        }
        super.doOKAction()
    }

    override fun getPreferredFocusedComponent(): JComponent? {
        return if (customUrlField.isVisible) customUrlField else platformComboBox
    }
}
package org.jetbrains.plugins.template

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages

class TestAuthAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val email = "stepan.efimov2006@mail.ru"
        val password = "2006723"

        try {
            val result = Authorization.getAuthCookie(email, password)
            Messages.showInfoMessage(result, "Результат авторизации")

        } catch (ex: Exception) {
            Messages.showErrorDialog("Ошибка: ${ex.message}", "Критический провал")
        }
    }
}
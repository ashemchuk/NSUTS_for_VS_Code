package org.jetbrains.plugins.template

import com.intellij.credentialStore.CredentialAttributes
import com.intellij.credentialStore.generateServiceName
import com.intellij.ide.passwordSafe.PasswordSafe

object NsutsSettings {
    private val cookieAttributes = CredentialAttributes(generateServiceName("NsutsPlugin", "auth_cookie"))

    fun saveCookie(cookie: String?) {
        PasswordSafe.instance.set(cookieAttributes, com.intellij.credentialStore.Credentials("nsuts", cookie))
    }

    fun getCookie(): String? {
        return PasswordSafe.instance.get(cookieAttributes)?.getPasswordAsString()
    }
}
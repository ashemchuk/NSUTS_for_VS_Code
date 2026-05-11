package ru.ashemchuk.nsutsintellij.config

import com.intellij.ide.util.PropertiesComponent
import java.net.URL

object PlatformConfig {
    private const val BASE_URL_KEY = "nsuts.baseUrl"
    private const val DEFAULT_BASE_URL = "https://fresh.nsuts.ru/nsuts-new/api/"

    /**
     * Get the currently selected base URL.
     * If not set, returns the default (fresh.nsuts).
     */
    fun getBaseUrl(): String {
        return PropertiesComponent.getInstance().getValue(BASE_URL_KEY) ?: DEFAULT_BASE_URL
    }

    /**
     * Set the base URL.
     */
    fun setBaseUrl(url: String) {
        PropertiesComponent.getInstance().setValue(BASE_URL_KEY, url)
    }

    /**
     * Extract host from a given URL string.
     * Returns empty string if URL is invalid.
     */
    fun getHostFromUrl(url: String): String {
        return try {
            URL(url).host
        } catch (e: Exception) {
            ""
        }
    }

    /**
     * Get the host of the currently selected base URL.
     */
    fun getCurrentHost(): String = getHostFromUrl(getBaseUrl())

    // Key generation helpers
    private fun cookieKey(host: String): String = "nsuts.cookie.$host"
    private fun emailKey(host: String): String = "nsuts.email.$host"
    private fun passwordKey(host: String): String = "nsuts.password.$host"

    // Legacy keys (for backward compatibility)
    private const val LEGACY_COOKIE_KEY = "nsuts.cookie"
    private const val LEGACY_EMAIL_KEY = "nsuts.email"
    private const val LEGACY_PASSWORD_KEY = "nsuts.password"

    // Credential storage
    fun getCookie(host: String? = null): String? {
        val h = host ?: getCurrentHost()
        return PropertiesComponent.getInstance().getValue(cookieKey(h))
            ?: PropertiesComponent.getInstance().getValue(LEGACY_COOKIE_KEY)
    }

    fun setCookie(cookie: String?, host: String? = null) {
        val h = host ?: getCurrentHost()
        PropertiesComponent.getInstance().setValue(cookieKey(h), cookie)
    }

    fun getEmail(host: String? = null): String? {
        val h = host ?: getCurrentHost()
        return PropertiesComponent.getInstance().getValue(emailKey(h))
            ?: PropertiesComponent.getInstance().getValue(LEGACY_EMAIL_KEY)
    }

    fun setEmail(email: String?, host: String? = null) {
        val h = host ?: getCurrentHost()
        PropertiesComponent.getInstance().setValue(emailKey(h), email)
    }

    fun getPassword(host: String? = null): String? {
        val h = host ?: getCurrentHost()
        return PropertiesComponent.getInstance().getValue(passwordKey(h))
            ?: PropertiesComponent.getInstance().getValue(LEGACY_PASSWORD_KEY)
    }

    fun setPassword(password: String?, host: String? = null) {
        val h = host ?: getCurrentHost()
        PropertiesComponent.getInstance().setValue(passwordKey(h), password)
    }

    /**
     * Clear all credentials for a specific host.
     */
    fun clearCredentials(host: String? = null) {
        val h = host ?: getCurrentHost()
        setCookie(null, h)
        setEmail(null, h)
        setPassword(null, h)
    }

    /**
     * Predefined platform URLs for quick selection.
     */
    val predefinedUrls = listOf(
        PlatformEntry(
            label = "fresh.nsuts",
            description = "https://fresh.nsuts.ru/nsuts-new/api/",
            url = "https://fresh.nsuts.ru/nsuts-new/api/"
        ),
        PlatformEntry(
            label = "olympic.nsu",
            description = "https://olympic.nsu.ru/nsuts-new/api/",
            url = "https://olympic.nsu.ru/nsuts-new/api/"
        ),
        PlatformEntry(
            label = "Custom URL...",
            description = "Enter a custom base URL",
            url = null
        )
    )
}

data class PlatformEntry(
    val label: String,
    val description: String,
    val url: String?
)
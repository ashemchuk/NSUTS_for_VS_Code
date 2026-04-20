package org.jetbrains.plugins.template

import java.net.HttpURLConnection
import java.net.URL

object Authorization {
    fun getAuthCookie(email: String, password: String): String? {
        val savedCookie: String? = NsutsSettings.getCookie()
        if (savedCookie.isNullOrEmpty()) return savedCookie

        return try {
            val url = URL("https://fresh.nsuts.ru/nsuts-new/api/login")
            val conn = url.openConnection() as HttpURLConnection

            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true

            val body = """{"email":"$email","password":"$password","method":"internal"}"""
            conn.outputStream.use { it.write(body.toByteArray()) }

            val newCookie = conn.getHeaderField("Set-Cookie")?.substringBefore(";")

            if (!newCookie.isNullOrEmpty()) {
                NsutsSettings.saveCookie(newCookie)
            }

            newCookie
        } catch (e: Exception) {
            System.err.println("Authorization error: ${e.message}")
            null
        }
    }

    fun logout() {
        NsutsSettings.saveCookie(null)
    }
}
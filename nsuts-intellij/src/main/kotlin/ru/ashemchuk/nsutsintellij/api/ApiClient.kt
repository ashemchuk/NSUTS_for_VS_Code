package ru.ashemchuk.nsutsintellij.api

import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.diagnostic.Logger
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * NSUTS API client.
 * Handles authentication and cookie storage.
 */
class ApiClient {
    companion object {
        private const val BASE_URL = "https://fresh.nsuts.ru/nsuts-new/api/"
        private const val COOKIE_KEY = "nsuts.cookie"
        private const val EMAIL_KEY = "nsuts.email"
        private const val PASSWORD_KEY = "nsuts.password"
        private val logger = Logger.getInstance(ApiClient::class.java)
        private val json = Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
        }
    }

    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(json)
        }
        defaultRequest {
            url(BASE_URL)
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Accept, "application/json")
            // Add cookie if present
            getCookie()?.let { cookie ->
                header(HttpHeaders.Cookie, cookie)
            }
        }
    }

    private fun getCookie(): String? = PropertiesComponent.getInstance().getValue(COOKIE_KEY)
    private fun setCookie(cookie: String?) = PropertiesComponent.getInstance().setValue(COOKIE_KEY, cookie ?: "")
    private fun getEmail(): String? = PropertiesComponent.getInstance().getValue(EMAIL_KEY)
    private fun setEmail(email: String?) = PropertiesComponent.getInstance().setValue(EMAIL_KEY, email ?: "")
    private fun getPassword(): String? = PropertiesComponent.getInstance().getValue(PASSWORD_KEY)
    private fun setPassword(password: String?) = PropertiesComponent.getInstance().setValue(PASSWORD_KEY, password ?: "")

    /**
     * Perform login with email and password, store cookie.
     */
    suspend fun login(email: String, password: String): Boolean {
        logger.warn("Starting login for $email")
        val loginRequest = LoginRequest(email = email, password = password, method = "internal")
        val jsonBody = json.encodeToString(loginRequest)
        logger.warn("Login request body: $jsonBody")
        val response: HttpResponse = client.post("login") {
            setBody(jsonBody)
            contentType(ContentType.Application.Json)
        }
        val status = response.status
        logger.warn("Login response status: $status")
        logger.warn("Login response URL: ${response.request.url}")
        val headers = response.headers
        headers.forEach { key, values ->
            logger.warn("Header $key: $values")
        }
        val cookie = response.headers[HttpHeaders.SetCookie]
        if (cookie.isNullOrEmpty()) {
            logger.error("Login failed: no cookie in response")
            // Log response body for debugging
            val body = try {
                response.bodyAsText()
            } catch (e: Exception) {
                "Unable to read body: ${e.message}"
            }
            logger.error("Response body: $body")
            return false
        }
        // Store credentials and cookie
        runBlocking {
            setEmail(email)
            setPassword(password)
            setCookie(cookie)
        }
        logger.warn("Login successful for $email")
        return true
    }

    /**
     * Logout by clearing stored credentials and cookie.
     */
    suspend fun logout() {
        runBlocking {
            setEmail(null)
            setPassword(null)
            setCookie(null)
        }
        client.post("/logout")
        logger.info("Logged out")
    }

    /**
     * Check if user is authenticated (has cookie).
     */
    fun isAuthenticated(): Boolean {
        return getCookie()?.isNotBlank() ?: false
    }

    // Generic request methods (private to avoid inline exposure)
    private suspend inline fun <reified T> get(path: String, query: Map<String, Any> = emptyMap()): T? {
        val response: HttpResponse = client.get(path) {
            query.forEach { (key, value) ->
                parameter(key, value)
            }
        }
        return if (response.status.isSuccess()) response.body() else null
    }

    private suspend inline fun <reified T> post(path: String, body: Any? = null): T? {
        val response: HttpResponse = client.post(path) {
            body?.let { setBody(it) }
        }
        return if (response.status.isSuccess()) response.body() else null
    }

    // Specific API calls (placeholder)
    suspend fun getOlympiads(): List<Olympiad>? {
        val response: ApiResponseOlympiads? = get("/olympiads/list")
        return response?.registeredTo?.map { it.toOlympiad() }
    }

    suspend fun getTours(): List<Tour>? {
        val response: ApiResponseTours? = get("/tours/list")
        return response?.tours?.map { it.toTour() }
    }

    suspend fun enterOlympiad(olympiadId: String) {
        post<Unit>("/olympiads/enter", EnterOlympiadRequest(olympiad = olympiadId))
    }

    suspend fun enterTour(tourId: Int) {
        get<Unit>("/tours/enter", mapOf("tour" to tourId))
    }

    suspend fun getSubmitInfo(): SubmitInfo? {
        return get("/submit/submit_info")
    }

    suspend fun submitSolution(taskId: String, langId: String, sourceText: String? = null, sourceFile: ByteArray? = null) {
        // TODO: implement multipart/form-data submission
    }
}

// Request/Response data classes
@kotlinx.serialization.Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val method: String = "internal"
)

@kotlinx.serialization.Serializable
data class EnterOlympiadRequest(val olympiad: String)

@kotlinx.serialization.Serializable
data class ApiResponseOlympiads(
    val registeredTo: List<ApiOlympiad>? = null,
    val canRegisterTo: List<ApiOlympiad>? = null
)

@kotlinx.serialization.Serializable
data class ApiOlympiad(
    val id: String,
    val title: String,
    val teams: String,
    val tours: String,
    val cover_url: String,
    val frozen: Boolean? = null,
    val hasInvite: Boolean? = null
) {
    fun toOlympiad(): Olympiad = Olympiad(id, title, cover_url)
}

@kotlinx.serialization.Serializable
data class ApiResponseTours(val tours: List<ApiTour>? = null)

@kotlinx.serialization.Serializable
data class ApiTour(
    val id: String,
    val title: String,
    val isOpened: String,
    val position: String,
    val tourModel: String
) {
    fun toTour(): Tour = Tour(id, title)
}

@kotlinx.serialization.Serializable
data class SubmitInfo(
    val langs: List<Lang>,
    val tasks: List<ApiTask>
)

@kotlinx.serialization.Serializable
data class Lang(val id: String, val title: String)

@kotlinx.serialization.Serializable
data class ApiTask(val id: String, val title: String)
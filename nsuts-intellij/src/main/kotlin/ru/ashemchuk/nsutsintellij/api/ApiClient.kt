package ru.ashemchuk.nsutsintellij.api

import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.diagnostic.Logger
import ru.ashemchuk.nsutsintellij.config.PlatformConfig
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.client.request.forms.*
import io.ktor.http.content.*
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.delay
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import ru.ashemchuk.nsutsintellij.api.LoginRequest
import ru.ashemchuk.nsutsintellij.api.EnterOlympiadRequest

/**
 * NSUTS API client.
 * Handles authentication and cookie storage.
 */
class ApiClient {
    companion object {
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
            url(PlatformConfig.getBaseUrl())
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Accept, "application/json")
            // Add cookie if present
            PlatformConfig.getCookie()?.let { cookie ->
                header(HttpHeaders.Cookie, cookie)
            }
        }
    }

    private fun getCookie(): String? = PlatformConfig.getCookie()
    private fun setCookie(cookie: String?) = PlatformConfig.setCookie(cookie)
    private fun getEmail(): String? = PlatformConfig.getEmail()
    private fun setEmail(email: String?) = PlatformConfig.setEmail(email)
    private fun getPassword(): String? = PlatformConfig.getPassword()
    private fun setPassword(password: String?) = PlatformConfig.setPassword(password)

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
        setEmail(email)
        setPassword(password)
        setCookie(cookie)
        logger.warn("Login successful for $email")
        return true
    }

    /**
     * Logout by clearing stored credentials and cookie.
     */
    suspend fun logout() {
        setEmail(null)
        setPassword(null)
        setCookie(null)
        client.post("logout")
        logger.info("Logged out")
    }

    /**
     * Check if user is authenticated (has cookie).
     */
    fun isAuthenticated(): Boolean {
        return !getCookie().isNullOrBlank()
    }

    // Generic request methods (private to avoid inline exposure)
    private suspend inline fun <reified T> get(path: String, query: Map<String, Any> = emptyMap()): T? {
        val response: HttpResponse = client.get(path) {
            query.forEach { (key, value) ->
                parameter(key, value)
            }
        }
        if (response.status.isSuccess()) {
            return response.body()
        } else {
            logApiError(response, path, "GET")
            return null
        }
    }

    private suspend inline fun <reified T> post(path: String, body: Any? = null): T? {
        val response: HttpResponse = client.post(path) {
            body?.let { setBody(it) }
        }
        if (response.status.isSuccess()) {
            return response.body()
        } else {
            logApiError(response, path, "POST")
            return null
        }
    }

    private suspend fun logApiError(response: HttpResponse, path: String, method: String) {
        val status = response.status
        logger.error("API request failed: $method $path -> $status")
        // Log response body for debugging
        val body = try {
            response.bodyAsText()
        } catch (e: Exception) {
            "Unable to read body: ${e.message}"
        }
        logger.error("Response body: $body")
        
        // If status is 404, suggest platform mismatch
        if (status == HttpStatusCode.NotFound) {
            val currentBaseUrl = PlatformConfig.getBaseUrl()
            val host = PlatformConfig.getCurrentHost()
            logger.warn("Endpoint not found (404). This may indicate that the selected platform ($host) uses a different API structure.")
            // Could show a notification, but we'll just log for now.
        }
    }

    // Specific API calls
    suspend fun getOlympiads(): List<Olympiad>? {
        val response: ApiResponseOlympiads? = get("olympiads/list")
        return response?.registeredTo?.map { it.toOlympiad() }
    }

    suspend fun getTours(): List<Tour>? {
        val response: ApiResponseTours? = get("tours/list")
        return response?.tours?.map { it.toTour() }
    }

    suspend fun enterOlympiad(olympiadId: String) {
        post<Unit>("olympiads/enter", EnterOlympiadRequest(olympiad = olympiadId))
    }

    suspend fun enterTour(tourId: Int) {
        get<Unit>("tours/enter", mapOf("tour" to tourId))
    }

    suspend fun getSubmitInfo(): SubmitInfo? {
        return get("submit/submit_info")
    }
    
    suspend fun getTasks(olympiadId: String, tourId: String): List<Task>? {
        // Enter the tour to set it as the current tour on the server
        enterTour(tourId.toInt())
        // Get the submit info which contains the tasks
        val submitInfo = getSubmitInfo()
        // Convert ApiTask to Task with olympiadId and tourId
        return submitInfo?.tasks?.map { apiTask ->
            Task(apiTask.id, apiTask.title, olympiadId, tourId)
        }
    }

    suspend fun submitSolution(taskId: String, langId: String, sourceText: String? = null, sourceFile: ByteArray? = null): Boolean {
        logger.warn("Submitting solution for task $taskId with lang $langId")
        
        return try {
            val response: HttpResponse = client.post("submit/do_submit") {
                setBody(
                    MultiPartFormDataContent(
                        formData {
                            append("taskId", taskId)
                            append("langId", langId)
                            
                            // Add source text if provided
                            sourceText?.let { text ->
                                append("sourceText", text)
                            }
                            
                            // Add source file if provided
                            sourceFile?.let { file ->
                                append(
                                    "sourceFile",
                                    file,
                                    Headers.build {
                                        append(HttpHeaders.ContentType, "application/octet-stream")
                                        append(HttpHeaders.ContentDisposition, "filename=\"solution.zip\"")
                                    }
                                )
                            }
                        }
                    )
                )
            }
            
            val status = response.status
            logger.warn("Submit response status: $status")
            
            if (status.isSuccess()) {
                val body = response.bodyAsText()
                logger.warn("Submit response body: $body")
                true
            } else {
                logger.error("Submit failed with status: $status")
                // Log response body for debugging
                val body = try {
                    response.bodyAsText()
                } catch (e: Exception) {
                    "Unable to read body: ${e.message}"
                }
                logger.error("Submit response body: $body")
                false
            }
        } catch (e: Exception) {
            logger.error("Submit failed with exception", e)
            false
        }
    }
    
    /**
     * Get submission reports for a task.
     */
    suspend fun getReports(taskId: String): List<Report>? {
        val response: ApiResponseGetReport? = get("report/get_report")
        logger.warn("Fetched reports for task $taskId: ${response?.submits?.size} submits")
        response?.submits?.forEach { submit ->
            logger.warn("Submit: id=${submit.id}, task_id=${submit.task_id}, status=${submit.status}")
        }
        return response?.submits
            ?.filter { it.task_id.toString() == taskId }
            ?.map { it.toReport() }
    }

    /**
     * Poll for submission result with exponential backoff.
     * Returns the final report when status is not Queued, or null on timeout.
     */
    suspend fun pollSubmissionResult(taskId: String, olympiadId: String, tourId: String, timeoutMs: Long = 30000, initialDelayMs: Long = 1000): Report? {
        val startTime = System.currentTimeMillis()
        var delay = initialDelayMs
        val maxDelay = 5000L
        var pollCount = 0

        while (System.currentTimeMillis() - startTime < timeoutMs) {
            pollCount++
            logger.warn("Poll #$pollCount for task $taskId (olympiad=$olympiadId, tour=$tourId)")
            // Set context before fetching reports
            enterOlympiad(olympiadId)
            enterTour(tourId.toInt())
            
            val reports = getReports(taskId)
            logger.warn("Reports count after filtering: ${reports?.size}")
            val latestReport = reports?.maxByOrNull { it.date }
            if (latestReport != null) {
                logger.warn("Latest report: id=${latestReport.id}, status=${latestReport.status}, date=${latestReport.date}")
                if (latestReport.status != ReportStatus.Queued) {
                    logger.warn("Found final report with status ${latestReport.status}")
                    return latestReport
                } else {
                    logger.warn("Report still queued, continuing...")
                }
            } else {
                logger.warn("No reports found for task $taskId")
            }
            // Wait before next poll
            logger.warn("Waiting ${delay}ms before next poll")
            delay(delay)
            // Exponential backoff
            delay = (delay * 1.5).toLong().coerceAtMost(maxDelay)
        }
        logger.warn("Polling timeout after $timeoutMs ms")
        return null // timeout
    }
}
package ru.ashemchuk.nsutsintellij.api

import kotlinx.serialization.Serializable

/**
 * Represents an Olympiad.
 */
@Serializable
data class Olympiad(
    val id: String,
    val title: String,
    val coverUrl: String
)

/**
 * Represents a Tour.
 */
@Serializable
data class Tour(
    val id: String,
    val title: String
)

/**
 * Represents a Task.
 */
@Serializable
data class Task(
    val id: String,
    val title: String,
    val olympiadId: String,
    val tourId: String
)

/**
 * Active task selected by user.
 */
@Serializable
data class ActiveTask(
    val taskId: String,
    val name: String,
    val tourId: String,
    val olympiadId: String
)

/**
 * Context for a task (selected files and compiler).
 */
@Serializable
data class TaskContext(
    val taskId: String? = null,
    val files: List<String> = emptyList(),
    val compiler: String? = null
)

/**
 * Report status enum.
 */
enum class ReportStatus {
    Queued,
    Successful,
    Unsuccessful
}

/**
 * Submission report.
 */
@Serializable
data class Report(
    val id: String,
    val compiler: String,
    val date: String,
    val result_line: String,
    val status: ReportStatus,
    val task_id: String,
    val task_title: String,
    val testNumber: String? = null,
    val points: String? = null,
    val total: String? = null
)

// API Response data classes

@Serializable
data class ApiResponseOlympiads(
    val registeredTo: List<ApiOlympiad>? = null,
    val canRegisterTo: List<ApiOlympiad>? = null
)

@Serializable
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

@Serializable
data class ApiResponseTours(val tours: List<ApiTour>? = null)

@Serializable
data class ApiTour(
    val id: String,
    val title: String,
    val isOpened: String,
    val position: String,
    val tourModel: String
) {
    fun toTour(): Tour = Tour(id, title)
}

@Serializable
data class SubmitInfo(
    val langs: List<Lang>,
    val tasks: List<ApiTask>
)

@Serializable
data class Lang(val id: String, val title: String)

@Serializable
data class ApiTask(val id: String, val title: String) {
    fun toTask(olympiadId: String, tourId: String): Task = Task(id, title, olympiadId, tourId)
}

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val method: String
)

@Serializable
data class EnterOlympiadRequest(
    val olympiad: String
)

@Serializable
data class ApiResponseReports(
    val reports: List<ApiReport>? = null
)

@Serializable
data class ApiResponseGetReport(
    val submits: List<ApiReport>? = null
)

@Serializable
data class ApiReport(
    val id: String,
    val compiler: String,
    val date: String,
    val result_line: String? = null,
    val status: String,
    val task_id: String,
    val task_title: String,
    val testNumber: String? = null,
    val points: String? = null,
    val total: String? = null
) {
    fun toReport(): Report {
        val reportStatus = when (status) {
            "1" -> ReportStatus.Queued
            "3" -> ReportStatus.Successful
            "4" -> ReportStatus.Unsuccessful
            else -> when (status.lowercase()) {
                "queued" -> ReportStatus.Queued
                "successful" -> ReportStatus.Successful
                "unsuccessful" -> ReportStatus.Unsuccessful
                else -> ReportStatus.Queued
            }
        }
        return Report(
            id = id,
            compiler = compiler,
            date = date,
            result_line = result_line ?: "",
            status = reportStatus,
            task_id = task_id,
            task_title = task_title,
            testNumber = testNumber,
            points = points,
            total = total
        )
    }
}
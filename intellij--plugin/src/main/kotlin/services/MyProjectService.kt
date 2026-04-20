package services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.thisLogger
import com.intellij.openapi.project.Project
import org.jetbrains.plugins.template.MyBundle
import kotlin.ranges.random

@com.intellij.openapi.components.Service(com.intellij.openapi.components.Service.Level.PROJECT)
class MyProjectService(project: com.intellij.openapi.project.Project) {

    init {
        thisLogger().info(org.jetbrains.plugins.template.MyBundle.message("projectService", project.name))
        thisLogger().warn("Don't forget to remove all non-needed sample code files with their corresponding registration entries in `plugin.xml`.")
    }

    fun getRandomNumber() = (1..100).random()
}

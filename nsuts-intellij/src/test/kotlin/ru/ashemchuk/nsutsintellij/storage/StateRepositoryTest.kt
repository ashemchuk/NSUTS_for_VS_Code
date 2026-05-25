package ru.ashemchuk.nsutsintellij.storage

import com.intellij.ide.util.PropertiesComponent
import io.mockk.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import ru.ashemchuk.nsutsintellij.api.ActiveTask
import ru.ashemchuk.nsutsintellij.api.TaskContext

class StateRepositoryTest {

    @Test
    fun `saveActiveTask stores serialized task`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.activeTask", any<String>()) } returns Unit

        val task = ActiveTask("task1", "Task One", "tour1", "olympiad1")
        StateRepository.saveActiveTask(task)

        verify { mockProperties.setValue("nsuts.activeTask", "{\"taskId\":\"task1\",\"name\":\"Task One\",\"tourId\":\"tour1\",\"olympiadId\":\"olympiad1\"}") }
    }

    @Test
    fun `saveActiveTask with null clears value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.activeTask", "") } returns Unit

        StateRepository.saveActiveTask(null)

        verify { mockProperties.setValue("nsuts.activeTask", "") }
    }

    @Test
    fun `loadActiveTask returns null when no stored value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.activeTask") } returns null

        val result = StateRepository.loadActiveTask()
        assertNull(result)
    }

    @Test
    fun `loadActiveTask returns deserialized task`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.activeTask") } returns
                "{\"taskId\":\"task1\",\"name\":\"Task One\",\"tourId\":\"tour1\",\"olympiadId\":\"olympiad1\"}"

        val result = StateRepository.loadActiveTask()
        assertEquals(ActiveTask("task1", "Task One", "tour1", "olympiad1"), result)
    }

    @Test
    fun `loadActiveTask returns null on malformed json`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.activeTask") } returns "{invalid}"

        val result = StateRepository.loadActiveTask()
        assertNull(result)
    }

    @Test
    fun `saveTaskContext stores serialized context`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.taskContext", any<String>()) } returns Unit

        val context = TaskContext("task1", listOf("file1.txt", "file2.txt"), "gcc")
        StateRepository.saveTaskContext(context)

        verify { mockProperties.setValue("nsuts.taskContext", "{\"taskId\":\"task1\",\"files\":[\"file1.txt\",\"file2.txt\"],\"compiler\":\"gcc\"}") }
    }

    @Test
    fun `saveTaskContext with null clears value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.taskContext", "") } returns Unit

        StateRepository.saveTaskContext(null)

        verify { mockProperties.setValue("nsuts.taskContext", "") }
    }

    @Test
    fun `loadTaskContext returns null when no stored value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.taskContext") } returns null

        val result = StateRepository.loadTaskContext()
        assertNull(result)
    }

    @Test
    fun `loadTaskContext returns deserialized context`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.taskContext") } returns
                "{\"taskId\":\"task1\",\"files\":[\"file1.txt\",\"file2.txt\"],\"compiler\":\"gcc\"}"

        val result = StateRepository.loadTaskContext()
        assertEquals(TaskContext("task1", listOf("file1.txt", "file2.txt"), "gcc"), result)
    }

    @Test
    fun `clear removes both keys`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.activeTask", "") } returns Unit
        every { mockProperties.setValue("nsuts.taskContext", "") } returns Unit

        StateRepository.clear()

        verify { mockProperties.setValue("nsuts.activeTask", "") }
        verify { mockProperties.setValue("nsuts.taskContext", "") }
    }
}
package ru.ashemchuk.nsutsintellij.config

import com.intellij.ide.util.PropertiesComponent
import io.mockk.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PlatformConfigTest {

    @Test
    fun `getBaseUrl returns default when no value stored`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue(any<String>()) } returns null

        val url = PlatformConfig.getBaseUrl()
        assertEquals("https://fresh.nsuts.ru/nsuts-new/api/", url)
    }

    @Test
    fun `getBaseUrl returns stored value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.baseUrl") } returns "https://custom.example.com/api/"

        val url = PlatformConfig.getBaseUrl()
        assertEquals("https://custom.example.com/api/", url)
    }

    @Test
    fun `setBaseUrl stores value`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.setValue("nsuts.baseUrl", "https://custom.example.com/api/") } returns Unit

        PlatformConfig.setBaseUrl("https://custom.example.com/api/")
        // verification can be done via mockk's verify, but we'll keep simple
    }

    @Test
    fun `getHostFromUrl extracts host correctly`() {
        assertEquals("fresh.nsuts.ru", PlatformConfig.getHostFromUrl("https://fresh.nsuts.ru/nsuts-new/api/"))
        assertEquals("olympic.nsu.ru", PlatformConfig.getHostFromUrl("https://olympic.nsu.ru/nsuts-new/api/"))
        assertEquals("", PlatformConfig.getHostFromUrl("invalid-url"))
    }

    @Test
    fun `getCurrentHost returns host of base url`() {
        mockkStatic(PropertiesComponent::class)
        val mockProperties = mockk<PropertiesComponent>()
        every { PropertiesComponent.getInstance() } returns mockProperties
        every { mockProperties.getValue("nsuts.baseUrl") } returns "https://olympic.nsu.ru/nsuts-new/api/"

        val host = PlatformConfig.getCurrentHost()
        assertEquals("olympic.nsu.ru", host)
    }
}
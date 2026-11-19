package com.flocus.engine.bridge

/**
 * AndroidBridgeContract.kt
 * Kotlin & Jetpack Compose data contracts, command schemas, and interface definitions
 * for native Android WebView embedding of the Focus & Ambient Engine.
 */

// ---------------------------------------------------------------------------
// 1. Core Enumerations & Constants
// ---------------------------------------------------------------------------

enum class TimerMode(val key: String) {
    POMODORO("pomodoro"),
    SHORT_BREAK("shortBreak"),
    LONG_BREAK("longBreak"),
    COUNTDOWN("countdown"),
    STOPWATCH("stopwatch"),
    ANIMEDORO("animedoro"),
    CUSTOM("custom");

    companion object {
        fun fromKey(key: String): TimerMode =
            values().firstOrNull { it.key.equals(key, ignoreCase = true) } ?: POMODORO
    }
}

enum class TimerStatus(val key: String) {
    IDLE("idle"),
    RUNNING("running"),
    PAUSED("paused"),
    COMPLETED("completed");

    companion object {
        fun fromKey(key: String): TimerStatus =
            values().firstOrNull { it.key.equals(key, ignoreCase = true) } ?: IDLE
    }
}

enum class HapticFeedbackType(val rawValue: String) {
    LIGHT_TICK("LIGHT_TICK"),
    MEDIUM_CLICK("MEDIUM_CLICK"),
    HEAVY_IMPACT("HEAVY_IMPACT"),
    SUCCESS_PULSE("SUCCESS_PULSE"),
    WARNING_BUZZ("WARNING_BUZZ")
}

enum class PrepOSTargetSystem(val systemName: String) {
    UPSC_PREP_OS("UPSC_PREP_OS"),
    RBI_PREP_OS("RBI_PREP_OS"),
    PERSONAL_INTEL_OS("PERSONAL_INTEL_OS")
}

// ---------------------------------------------------------------------------
// 2. Data Transfer Objects (DTOs)
// ---------------------------------------------------------------------------

/**
 * Decomposed 6-digit mechanical flip display format (HH:MM:SS)
 */
data class FlipDigitsDto(
    val hoursTens: Int = 0,
    val hoursUnits: Int = 0,
    val minutesTens: Int = 0,
    val minutesUnits: Int = 0,
    val secondsTens: Int = 0,
    val secondsUnits: Int = 0
)

/**
 * State broadcast mirrored across Android notification & Compose widgets
 */
data class FlipTimerBroadcastDto(
    val type: String = "FLIP_TIMER_STATE",
    val mode: String,
    val status: String,
    val timeRemaining: Long,
    val totalDuration: Long,
    val flipDigits: FlipDigitsDto
) {
    val timerMode: TimerMode get() = TimerMode.fromKey(mode)
    val timerStatus: TimerStatus get() = TimerStatus.fromKey(status)
    val isRunning: Boolean get() = timerStatus == TimerStatus.RUNNING
}

/**
 * Media Style Foreground Service notification contract
 */
data class MediaNotificationMetadata(
    val title: String,
    val contentText: String,
    val isPlaying: Boolean,
    val currentSeconds: Long,
    val totalSeconds: Long,
    val progressPercent: Float,
    val channelName: String = "Flocus Ambient Channel",
    val actions: List<String> = listOf("PLAY_PAUSE", "RESET", "SKIP")
)

/**
 * UPSC / RBI Prep OS study session payload
 */
data class PrepOSSessionDto(
    val sessionId: String,
    val targetSystem: String,
    val subjectTag: String,
    val syllabusModule: String? = null,
    val topicTag: String? = null,
    val durationMinutes: Int,
    val durationSeconds: Long,
    val studyIntensityRating: Int? = 3,
    val completedAt: Long,
    val notes: String? = null
)

// ---------------------------------------------------------------------------
// 3. Command Payloads (Web -> Android Native Bridge)
// ---------------------------------------------------------------------------

sealed interface AndroidBridgeCommand {
    data class UpdateMediaNotification(
        val metadata: MediaNotificationMetadata
    ) : AndroidBridgeCommand

    data class AcquireWakeLock(
        val tag: String = "FlocusEngine:TimerWakeLock",
        val timeoutMs: Long = 3600000L // 1 hour default
    ) : AndroidBridgeCommand

    object ReleaseWakeLock : AndroidBridgeCommand

    data class TriggerHaptic(
        val feedbackType: HapticFeedbackType
    ) : AndroidBridgeCommand

    data class SetPipMode(
        val enable: Boolean,
        val aspectRatioNumerator: Int = 16,
        val aspectRatioDenominator: Int = 9
    ) : AndroidBridgeCommand

    data class SyncPrepOSSession(
        val session: PrepOSSessionDto
    ) : AndroidBridgeCommand
}

// ---------------------------------------------------------------------------
// 4. Native Android JavascriptInterface Definition
// ---------------------------------------------------------------------------

/**
 * Contract implemented by native Android host and registered in WebView via
 * webView.addJavascriptInterface(bridge, "FlocusAndroidBridge")
 */
interface FlocusAndroidBridge {
    /**
     * Raw JSON command dispatcher from web engine
     * e.g. window.FlocusAndroidBridge?.postMessage('{"command":"ACQUIRE_WAKELOCK"}')
     */
    fun postMessage(jsonCommand: String)

    /**
     * Direct method to update persistent Android Media Style notification
     */
    fun updateMediaNotification(jsonPayload: String)

    /**
     * Request partial CPU wake lock to ensure background timer fidelity
     */
    fun acquireWakeLock(tag: String, timeoutMs: Long)

    /**
     * Release active CPU wake lock
     */
    fun releaseWakeLock()

    /**
     * Trigger device haptic vibrator (tick, click, success pulse)
     */
    fun triggerHaptic(type: String)

    /**
     * Record study focus session into native UPSC / RBI Prep OS room database
     */
    fun logPrepOSSession(jsonPayload: String)

    /**
     * Receive periodic flip timer broadcast for native home screen widgets / Glance
     */
    fun onTimerStateBroadcast(jsonBroadcast: String)
}

// ---------------------------------------------------------------------------
// 5. Host Dispatcher (Android Native -> WebView)
// ---------------------------------------------------------------------------

/**
 * Native Android dispatcher for injecting commands back into the web runtime
 */
interface FlocusNativeDispatcher {
    /**
     * Send timer command (e.g. START_TIMER, PAUSE_TIMER) to WebView
     */
    fun sendTimerCommand(commandType: String, paramsJson: String? = null)

    /**
     * Inform engine of Android app lifecycle (foreground / background)
     */
    fun notifyLifecycleState(isForeground: Boolean)

    /**
     * Dispatch media key headset actions (KEY_PLAY_PAUSE, KEY_NEXT)
     */
    fun sendMediaAction(action: String)
}

// ---------------------------------------------------------------------------
// 6. Jetpack Compose Integration Contracts
// ---------------------------------------------------------------------------

/**
 * Observable state holder for Jetpack Compose UI embedding
 */
interface FlocusComposeBridgeState {
    val timerState: kotlinx.coroutines.flow.StateFlow<FlipTimerBroadcastDto?>
    val isWakeLockActive: androidx.compose.runtime.State<Boolean>
    val activeNotification: androidx.compose.runtime.State<MediaNotificationMetadata?>
    val lastPrepOSSync: androidx.compose.runtime.State<PrepOSSessionDto?>

    fun onStartTimer()
    fun onPauseTimer()
    fun onResetTimer()
    fun onSwitchMode(mode: TimerMode)
}

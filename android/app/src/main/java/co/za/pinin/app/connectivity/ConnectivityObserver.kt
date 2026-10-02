package co.za.pinin.app.connectivity

import kotlinx.coroutines.flow.Flow

/**
 * Interface defining real-time network connectivity observation.
 */
interface ConnectivityObserver {
    enum class Status {
        Available,
        Unavailable,
        Losing,
        Lost
    }

    /**
     * Synchronous check of validated internet connectivity using modern NetworkCapabilities.
     */
    val isConnected: Boolean

    /**
     * Cold flow that observes network changes in real time.
     */
    fun observe(): Flow<Status>
}

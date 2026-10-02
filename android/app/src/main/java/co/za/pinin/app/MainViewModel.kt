package co.za.pinin.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import co.za.pinin.app.connectivity.ConnectivityObserver
import co.za.pinin.app.model.CartItem
import co.za.pinin.app.model.ListingItem
import co.za.pinin.app.model.SampleListings
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed class AppScreen {
    object Home : AppScreen()
    data class Detail(val item: ListingItem) : AppScreen()
    object Cart : AppScreen()
}

/**
 * ViewModel managing navigation state, 2-to-3 second artificial loading delays with shimmer skeletons,
 * cart state, and real-time network connectivity.
 */
class MainViewModel(
    private val connectivityObserver: ConnectivityObserver
) : ViewModel() {

    // Screen navigation state
    private val _currentScreen = MutableStateFlow<AppScreen>(AppScreen.Home)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    // Smooth artificial loading delay for shimmer skeletons (2.5s within the requested 2-3s window)
    private val _isScreenLoading = MutableStateFlow(true)
    val isScreenLoading: StateFlow<Boolean> = _isScreenLoading.asStateFlow()

    // Listings data
    private val _listings = MutableStateFlow<List<ListingItem>>(SampleListings.items)
    val listings: StateFlow<List<ListingItem>> = _listings.asStateFlow()

    // Cart items state
    private val _cartItems = MutableStateFlow<List<CartItem>>(
        listOf(CartItem(item = SampleListings.items[0], quantity = 1))
    )
    val cartItems: StateFlow<List<CartItem>> = _cartItems.asStateFlow()

    // Real-time network monitoring
    val networkStatus: StateFlow<ConnectivityObserver.Status> = connectivityObserver.observe()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = if (connectivityObserver.isConnected) {
                ConnectivityObserver.Status.Available
            } else {
                ConnectivityObserver.Status.Unavailable
            }
        )

    private val _isRetrying = MutableStateFlow(false)
    val isRetrying: StateFlow<Boolean> = _isRetrying.asStateFlow()

    private val _manualOverride = MutableStateFlow<ConnectivityObserver.Status?>(null)
    val manualOverride: StateFlow<ConnectivityObserver.Status?> = _manualOverride.asStateFlow()

    init {
        // App launch: 2.5 second artificial loading delay showing shimmer skeleton
        viewModelScope.launch {
            delay(2500)
            _isScreenLoading.value = false
        }
    }

    /**
     * Navigates to a new screen with a smooth 2.5s artificial loading delay
     * displaying modern Jetpack Compose shimmer skeleton placeholders.
     */
    fun navigateTo(screen: AppScreen) {
        viewModelScope.launch {
            _currentScreen.value = screen
            _isScreenLoading.value = true
            // Smooth 2.5 second artificial delay for shimmer placeholders
            delay(2500)
            _isScreenLoading.value = false
        }
    }

    fun addToCart(item: ListingItem) {
        val current = _cartItems.value.toMutableList()
        val existingIndex = current.indexOfFirst { it.item.id == item.id }
        if (existingIndex >= 0) {
            current[existingIndex] = current[existingIndex].copy(quantity = current[existingIndex].quantity + 1)
        } else {
            current.add(CartItem(item = item, quantity = 1))
        }
        _cartItems.value = current
    }

    fun updateCartQuantity(itemId: String, quantity: Int) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.item.id == itemId }
        if (index >= 0) {
            if (quantity <= 0) {
                current.removeAt(index)
            } else {
                current[index] = current[index].copy(quantity = quantity)
            }
            _cartItems.value = current
        }
    }

    fun removeFromCart(itemId: String) {
        _cartItems.value = _cartItems.value.filter { it.item.id != itemId }
    }

    fun clearCart() {
        _cartItems.value = emptyList()
    }

    fun retry() {
        if (_isRetrying.value) return
        viewModelScope.launch {
            _isRetrying.value = true
            delay(750)
            val isNowConnected = connectivityObserver.isConnected
            if (isNowConnected) {
                _manualOverride.value = ConnectivityObserver.Status.Available
            } else {
                _manualOverride.value = ConnectivityObserver.Status.Unavailable
            }
            _isRetrying.value = false
        }
    }
}

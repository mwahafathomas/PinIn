package co.za.pinin.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import co.za.pinin.app.connectivity.ConnectivityObserver
import co.za.pinin.app.connectivity.NetworkConnectivityObserver
import co.za.pinin.app.ui.OfflineScreen
import co.za.pinin.app.ui.screens.CartScreen
import co.za.pinin.app.ui.screens.HomeScreen
import co.za.pinin.app.ui.screens.ListingDetailScreen
import co.za.pinin.app.ui.theme.PinInTheme
import com.onesignal.OneSignal
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var connectivityObserver: ConnectivityObserver
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = androidx.activity.SystemBarStyle.light(
                android.graphics.Color.WHITE,
                android.graphics.Color.WHITE
            ),
            navigationBarStyle = androidx.activity.SystemBarStyle.light(
                android.graphics.Color.WHITE,
                android.graphics.Color.WHITE
            )
        )

        // 4. Create Notification Channel for Android 8+
        createNotificationChannel()

        // 2. In MainActivity.kt initialize OneSignal on app start
        OneSignal.initWithContext(this, "47242cd4-ecdc-4348-82aa-0274bee57d27")
        lifecycleScope.launch {
            try {
                OneSignal.Notifications.requestPermission(true)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // 3 & 6. FIX THE CRASH BUG & Show Real System Permission Dialog on Android 13+
        requestSystemNotificationPermission()

        // 6. Request storage permission at runtime if Android version < 13
        requestStoragePermissionIfNeeded()

        connectivityObserver = NetworkConnectivityObserver(applicationContext)
        viewModel = MainViewModel(connectivityObserver)

        setContent {
            PinInTheme {
                MainAppContainer(viewModel = viewModel)
            }
        }
    }

    companion object {
        const val NOTIFICATION_PERMISSION_CODE = 1001
        const val STORAGE_PERMISSION_CODE = 1002
        const val DOWNLOAD_CHANNEL_ID = "pinin_downloads"
    }

    /**
     * Create Notification Channels for Android 8+
     * Channel 1: pinin_default (OneSignal push notifications)
     * Channel 2: pinin_downloads (Invoice download completed notifications)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

            // Default push notification channel
            val pushChannel = NotificationChannel(
                "pinin_default",
                "PinIn Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "PinIn push notifications"
                enableVibration(true)
            }
            notificationManager?.createNotificationChannel(pushChannel)

            // Invoice download notification channel
            val downloadChannel = NotificationChannel(
                DOWNLOAD_CHANNEL_ID,
                "PinIn Downloads",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for saved invoice PDF files"
                enableVibration(true)
            }
            notificationManager?.createNotificationChannel(downloadChannel)
        }
    }

    /**
     * Request notification permission on Android 13+ (API 33+) using the real system dialog
     */
    private fun requestSystemNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_CODE
                )
            }
        }
    }

    /**
     * Step 6: Request storage permission at runtime if Android version < 13 (API < 33)
     */
    fun requestStoragePermissionIfNeeded(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            val writePermission = ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
            if (writePermission != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(
                        android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
                        android.Manifest.permission.READ_EXTERNAL_STORAGE
                    ),
                    STORAGE_PERMISSION_CODE
                )
                return false
            }
        }
        return true
    }

    /**
     * Step 3, 4 & 5: JavaScript Interface exposed to webview / client as window.Android.saveInvoice(base64Data, fileName)
     * Saves base64 PDF into device Downloads directory, shows Toast "Invoice saved to Downloads",
     * and shows a system notification to tap and open the PDF.
     */
    inner class AndroidInvoiceBridge {
        @android.webkit.JavascriptInterface
        fun saveInvoice(base64Data: String, fileName: String) {
            saveInvoiceToDownloads(base64Data, fileName)
        }
    }

    fun saveInvoiceToDownloads(base64Data: String, fileName: String) {
        try {
            val cleanFileName = if (fileName.endsWith(".pdf", ignoreCase = true)) fileName else "$fileName.pdf"
            val pdfBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)

            var savedUri: android.net.Uri? = null
            var savedFile: java.io.File? = null

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Use MediaStore Downloads collection
                val contentValues = android.content.ContentValues().apply {
                    put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, cleanFileName)
                    put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                }

                val resolver = applicationContext.contentResolver
                val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { outputStream ->
                        outputStream.write(pdfBytes)
                        outputStream.flush()
                    }
                    savedUri = uri
                }
            } else {
                // Android 9 and below: Write directly to Environment.DIRECTORY_DOWNLOADS
                val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val destFile = java.io.File(downloadsDir, cleanFileName)
                java.io.FileOutputStream(destFile).use { output ->
                    output.write(pdfBytes)
                    output.flush()
                }
                savedFile = destFile
                savedUri = androidx.core.content.FileProvider.getUriForFile(
                    this,
                    "${applicationContext.packageName}.fileprovider",
                    destFile
                )
            }

            // Step 5: After download, show Toast "Invoice saved to Downloads"
            runOnUiThread {
                android.widget.Toast.makeText(
                    applicationContext,
                    "Invoice saved to Downloads",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }

            // Step 5: Show system notification to open the file
            if (savedUri != null) {
                showDownloadNotification(cleanFileName, savedUri)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            runOnUiThread {
                android.widget.Toast.makeText(
                    applicationContext,
                    "Error saving invoice: ${e.localizedMessage ?: "Unknown error"}",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun showDownloadNotification(fileName: String, fileUri: android.net.Uri) {
        try {
            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
                setDataAndType(fileUri, "application/pdf")
                addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            val pendingIntent = android.app.PendingIntent.getActivity(
                this,
                (System.currentTimeMillis() % 10000).toInt(),
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) android.app.PendingIntent.FLAG_IMMUTABLE else 0)
            )

            val notification = androidx.core.app.NotificationCompat.Builder(this, DOWNLOAD_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle("Invoice Downloaded")
                .setContentText(fileName)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                .build()

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.notify((System.currentTimeMillis() % 10000).toInt(), notification)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Handles permission request results without closing the activity,
     * launching an intent to the home screen, or finishing the app.
     */
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            NOTIFICATION_PERMISSION_CODE -> {
                // Wait for user to click Allow / Don't Allow without closing activity
            }
            STORAGE_PERMISSION_CODE -> {
                // Storage permission handled smoothly
            }
        }
    }
}

/**
 * Main application container composable.
 * Renders screens with Material 3 shimmer skeleton loaders during the 2-to-3 second
 * artificial loading delay when opening the app or navigating between screens.
 * Gracefully displays the dedicated OfflineScreen when internet connectivity is lost.
 */
@Composable
fun MainAppContainer(viewModel: MainViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val isScreenLoading by viewModel.isScreenLoading.collectAsState()
    val listings by viewModel.listings.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()

    val networkStatus by viewModel.networkStatus.collectAsState()
    val manualOverride by viewModel.manualOverride.collectAsState()
    val isRetrying by viewModel.isRetrying.collectAsState()

    val effectiveStatus = manualOverride ?: networkStatus
    val isOnline = effectiveStatus == ConnectivityObserver.Status.Available

    // Handle Android system back gesture to navigate back to feed
    BackHandler(enabled = currentScreen !is AppScreen.Home) {
        viewModel.navigateTo(AppScreen.Home)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Active Screen Composable with Shimmer Skeletons
        when (val screen = currentScreen) {
            is AppScreen.Home -> {
                HomeScreen(
                    items = listings,
                    isLoading = isScreenLoading,
                    cartCount = cartItems.sumOf { it.quantity },
                    onOpenDetail = { item ->
                        viewModel.navigateTo(AppScreen.Detail(item))
                    },
                    onOpenCart = {
                        viewModel.navigateTo(AppScreen.Cart)
                    }
                )
            }
            is AppScreen.Detail -> {
                ListingDetailScreen(
                    item = screen.item,
                    isLoading = isScreenLoading,
                    onBack = { viewModel.navigateTo(AppScreen.Home) },
                    onAddToCart = { item ->
                        viewModel.addToCart(item)
                    },
                    onBuyNow = { item ->
                        viewModel.addToCart(item)
                        viewModel.navigateTo(AppScreen.Cart)
                    }
                )
            }
            is AppScreen.Cart -> {
                CartScreen(
                    cartItems = cartItems,
                    isLoading = isScreenLoading,
                    onBack = { viewModel.navigateTo(AppScreen.Home) },
                    onUpdateQuantity = { id, qty ->
                        viewModel.updateCartQuantity(id, qty)
                    },
                    onRemoveItem = { id ->
                        viewModel.removeFromCart(id)
                    },
                    onPlaceOrder = {
                        viewModel.clearCart()
                        viewModel.navigateTo(AppScreen.Home)
                    }
                )
            }
        }

        // Dedicated Offline Screen: automatically blocks main content gracefully when offline
        AnimatedVisibility(
            visible = !isOnline,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            OfflineScreen(
                onRetry = { viewModel.retry() },
                isRetrying = isRetrying
            )
        }
    }
}

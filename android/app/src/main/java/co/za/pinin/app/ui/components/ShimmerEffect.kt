package co.za.pinin.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Modern Jetpack Compose shimmer effect modifier for skeleton loaders.
 * Produces a smooth diagonal shimmering light sweep across placeholder elements.
 */
fun Modifier.shimmerEffect(): Modifier = composed {
    val isDark = isSystemInDarkTheme()
    val shimmerColors = if (isDark) {
        listOf(
            Color(0xFF27272A),
            Color(0xFF3F3F46),
            Color(0xFF52525B),
            Color(0xFF3F3F46),
            Color(0xFF27272A)
        )
    } else {
        listOf(
            Color(0xFFE5E7EB),
            Color(0xFFF3F4F6),
            Color(0xFFFFFFFF),
            Color(0xFFF3F4F6),
            Color(0xFFE5E7EB)
        )
    }

    val transition = rememberInfiniteTransition(label = "shimmer_transition")
    val translateAnim = transition.animateFloat(
        initialValue = -300f,
        targetValue = 1500f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1350, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset(x = translateAnim.value - 400f, y = translateAnim.value - 400f),
        end = Offset(x = translateAnim.value, y = translateAnim.value)
    )

    this.background(brush)
}

/**
 * Reusable placeholder container with rounded corners and shimmer animation.
 */
@Composable
fun ShimmerBox(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(12.dp)
) {
    Box(
        modifier = modifier
            .clip(shape)
            .shimmerEffect()
    )
}

/**
 * Reusable text line placeholder with shimmer.
 */
@Composable
fun ShimmerTextLine(
    modifier: Modifier = Modifier,
    height: Dp = 14.dp,
    widthFraction: Float = 1.0f
) {
    Box(
        modifier = modifier
            .fillMaxWidth(widthFraction)
            .height(height)
            .clip(RoundedCornerShape(6.dp))
            .shimmerEffect()
    )
}

/**
 * Reusable avatar or circular icon shimmer placeholder.
 */
@Composable
fun ShimmerCircle(
    size: Dp = 40.dp,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .shimmerEffect()
    )
}

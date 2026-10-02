package co.za.pinin.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import co.za.pinin.app.model.ListingItem
import co.za.pinin.app.ui.theme.PinInPrimary

/**
 * Modern Material 3 Listing Card displaying product image, badges, title, price, and seller rating.
 */
@Composable
fun ListingCard(
    item: ListingItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Product Image Container with Badges
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            ) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(item.imageUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = item.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // "In Stock" subtle badge
                if (item.inStock) {
                    Surface(
                        color = Color(0xFF10B981).copy(alpha = 0.92f),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .padding(8.dp)
                            .align(Alignment.TopStart)
                    ) {
                        Text(
                            text = "In Stock",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Card Content Details
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                // Title
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurface,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Price
                Text(
                    text = "R %,.2f".format(item.price),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Black,
                        color = PinInPrimary
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Seller and Rating Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = item.soldBy,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.Star,
                            contentDescription = "Rating",
                            tint = Color(0xFFF59E0B),
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = item.rating.toString(),
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

/**
 * Modern Jetpack Compose Shimmer Skeleton Loader for Listing Card.
 * Displays shimmering placeholder shapes for image, badge, title lines, price, and seller info.
 */
@Composable
fun ListingCardShimmer(modifier: Modifier = Modifier) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Shimmer Image Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
                    .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .shimmerEffect()
            ) {
                // Shimmer Badge Placeholder
                ShimmerBox(
                    modifier = Modifier
                        .padding(8.dp)
                        .size(width = 60.dp, height = 20.dp)
                        .align(Alignment.TopStart),
                    shape = RoundedCornerShape(8.dp)
                )
            }

            // Shimmer Content Lines
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
            ) {
                // Title Line 1 (85% width)
                ShimmerTextLine(height = 14.dp, widthFraction = 0.85f)
                Spacer(modifier = Modifier.height(6.dp))

                // Title Line 2 (55% width)
                ShimmerTextLine(height = 14.dp, widthFraction = 0.55f)
                Spacer(modifier = Modifier.height(10.dp))

                // Price Placeholder
                ShimmerBox(
                    modifier = Modifier.size(width = 90.dp, height = 18.dp),
                    shape = RoundedCornerShape(6.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Seller Row Placeholder
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    ShimmerBox(
                        modifier = Modifier.size(width = 75.dp, height = 12.dp),
                        shape = RoundedCornerShape(4.dp)
                    )
                    ShimmerBox(
                        modifier = Modifier.size(width = 36.dp, height = 12.dp),
                        shape = RoundedCornerShape(4.dp)
                    )
                }
            }
        }
    }
}

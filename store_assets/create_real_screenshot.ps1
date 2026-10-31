Add-Type -AssemblyName System.Drawing

$popupSrc = "C:\Users\Hassaan\.gemini\antigravity\brain\b2d1b685-36c0-4596-8186-fcb699d8d5c6\.user_uploaded\media_1793432777028_e55c6eab.png"
$bmpPopup = New-Object System.Drawing.Bitmap($popupSrc)

$w = 1280
$h = 800

# 24bpp RGB (No alpha) required by Chrome Web Store
$dest = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Dark sleek background #09090b
$brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(9, 9, 11))
$g.FillRectangle($brushBg, 0, 0, $w, $h)

# 2. Subtle ambient gradient
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(15, 23, 42), # dark slate
    [System.Drawing.Color]::FromArgb(9, 9, 11),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
)
$g.FillRectangle($gradBrush, 0, 0, $w, $h)

# 3. Outer border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(39, 39, 42), 2)
$g.DrawRectangle($borderPen, 1, 1, $w - 2, $h - 2)

# 4. Left side: Feature Highlights & Value Props
$fontTitle = New-Object System.Drawing.Font("Segoe UI", 36, [System.Drawing.FontStyle]::Bold)
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 250, 250))
$g.DrawString("Memoreply", $fontTitle, $brushWhite, 80, 100)

$fontTag = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$brushEmerald = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
$g.DrawString("Workspace Ledger & Response Composer", $fontTag, $brushEmerald, 80, 165)

$fontDesc = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
$brushMuted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
$desc = "Instant client context engine for freelancers and agency teams.`nWorks seamlessly on Fiverr, Upwork, and LinkedIn."
$g.DrawString($desc, $fontDesc, $brushMuted, 80, 215)

# Feature cards on left
$features = @(
    @{ title = "Deterministic Context Memory"; text = "Extracts agreements, timelines, and budgets from active chats." },
    @{ title = "1-Click Polite Responses"; text = "Generate context-aware polite replies to push back on scope creep." },
    @{ title = "Privacy-First Architecture"; text = "Local storage ensures client confidentiality and data security." }
)

$fy = 310
$fontFeatTitle = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$fontFeatDesc = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
$brushCardBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 20, 24))
$penCardBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(39, 39, 42), 1)

foreach ($f in $features) {
    $g.FillRectangle($brushCardBg, 80, $fy, 500, 85)
    $g.DrawRectangle($penCardBorder, 80, $fy, 500, 85)
    
    # Small emerald indicator dot
    $g.FillEllipse($brushEmerald, 100, $fy + 22, 10, 10)
    $g.DrawString($f.title, $fontFeatTitle, $brushWhite, 122, $fy + 16)
    $g.DrawString($f.text, $fontFeatDesc, $brushMuted, 122, $fy + 44)
    $fy += 105
}

# 5. Right side: The Real Extension Screenshot nicely framed
# Original popup aspect ratio: scale to fit around height 680
$targetH = 680
$scale = $targetH / $bmpPopup.Height
$targetW = [int]($bmpPopup.Width * $scale)
$targetX = $w - $targetW - 80
$targetY = 60

# Shadow/Glow behind the popup
$brushShadow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 0, 0))
$g.FillRectangle($brushShadow, $targetX + 8, $targetY + 8, $targetW, $targetH)

# Draw actual popup image
$g.DrawImage($bmpPopup, $targetX, $targetY, $targetW, $targetH)

# Border around popup to make it crisp
$penPopupBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(63, 63, 70), 2)
$g.DrawRectangle($penPopupBorder, $targetX, $targetY, $targetW, $targetH)

# Save as 24-bit PNG
$outPath = "C:\Users\Hassaan\Desktop\Extention\store_assets\screenshot-extension-1280x800.png"
$dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$dest.Dispose()
$bmpPopup.Dispose()

Write-Output "Perfect 1280x800 Extension Screenshot created at: $outPath"


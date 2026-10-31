Add-Type -AssemblyName System.Drawing

$logoPath = "C:\Users\Hassaan\Desktop\Extention\apps\web\public\memoreply-mark.png"
$bmpLogo = New-Object System.Drawing.Bitmap($logoPath)

function Create-Promo($width, $height, $outPath, $title, $subtitle) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(9, 9, 11))
    $g.FillRectangle($brushBg, 0, 0, $width, $height)

    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(16, 24, 48),
        [System.Drawing.Color]::FromArgb(9, 9, 11),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillRectangle($gradBrush, 0, 0, $width, $height)

    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(39, 39, 42), 2)
    $g.DrawRectangle($borderPen, 1, 1, $width - 2, $height - 2)

    if ($width -eq 1400) {
        $logoSize = 340
        $g.DrawImage($bmpLogo, 80, 110, $logoSize, $logoSize)

        $fontTitle = New-Object System.Drawing.Font("Segoe UI", 44, [System.Drawing.FontStyle]::Bold)
        $brushTitle = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 250, 250))
        $g.DrawString("Memoreply", $fontTitle, $brushTitle, 470, 130)

        $fontTag = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
        $brushTag = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
        $g.DrawString("Workspace Ledger & Response Composer", $fontTag, $brushTag, 470, 205)

        $fontSub = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
        $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
        $g.DrawString("Deterministic context engine for client communication across`nFiverr, Upwork, and LinkedIn.", $fontSub, $brushSub, 470, 255)

        $fontPill = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
        $brushPillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 24, 27))
        $brushPillText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228, 228, 231))
        $penPill = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(63, 63, 70), 1)

        $pills = @("Floating Widget", "Thread Extraction", "1-Click Polite Replies", "Privacy-First")
        $px = 470
        foreach ($p in $pills) {
            $size = $g.MeasureString($p, $fontPill)
            $pw = [int]$size.Width + 24
            $ph = 36
            $g.FillRectangle($brushPillBg, $px, 350, $pw, $ph)
            $g.DrawRectangle($penPill, $px, 350, $pw, $ph)
            $g.DrawString($p, $fontPill, $brushPillText, $px + 12, 356)
            $px += $pw + 16
        }

    } elseif ($width -eq 440) {
        $logoSize = 100
        $g.DrawImage($bmpLogo, 30, 90, $logoSize, $logoSize)

        $fontTitle = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
        $brushTitle = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 250, 250))
        $g.DrawString("Memoreply", $fontTitle, $brushTitle, 145, 95)

        $fontTag = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
        $brushTag = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
        $g.DrawString("Workspace Memory Ledger", $fontTag, $brushTag, 145, 130)

        $fontSub = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)
        $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
        $g.DrawString("For Fiverr, Upwork & LinkedIn", $fontSub, $brushSub, 145, 155)

    } elseif ($width -eq 1280) {
        $fontTop = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Bold)
        $brushTop = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(250, 250, 250))
        $g.DrawString($title, $fontTop, $brushTop, 60, 45)

        $fontSub = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
        $brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
        $g.DrawString($subtitle, $fontSub, $brushSub, 60, 95)

        $cardX = 60
        $cardY = 150
        $cardW = 1160
        $cardH = 590
        $brushCard = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 18, 20))
        $penCard = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(39, 39, 42), 1)
        $g.FillRectangle($brushCard, $cardX, $cardY, $cardW, $cardH)
        $g.DrawRectangle($penCard, $cardX, $cardY, $cardW, $cardH)

        $brushCardHeader = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 24, 27))
        $g.FillRectangle($brushCardHeader, $cardX, $cardY, $cardW, 55)
        $g.DrawLine($penCard, $cardX, $cardY + 55, $cardX + $cardW, $cardY + 55)

        $brushRed = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
        $brushYellow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(234, 179, 8))
        $brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94))
        $g.FillEllipse($brushRed, $cardX + 20, $cardY + 22, 12, 12)
        $g.FillEllipse($brushYellow, $cardX + 40, $cardY + 22, 12, 12)
        $g.FillEllipse($brushGreen, $cardX + 60, $cardY + 22, 12, 12)

        $fontCardHeader = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("Memoreply Assistant - Connected to Active Platform", $fontCardHeader, $brushSub, $cardX + 90, $cardY + 18)

        $logoSize = 140
        $g.DrawImage($bmpLogo, $cardX + 60, $cardY + 100, $logoSize, $logoSize)

        $fontCardTitle = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
        $g.DrawString("Client Thread Context & Decision Ledger", $fontCardTitle, $brushTop, $cardX + 230, $cardY + 105)

        $fontTag = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
        $brushTag = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
        $g.DrawString("Active Session: Upwork / Fiverr / LinkedIn", $fontTag, $brushTag, $cardX + 230, $cardY + 150)

        $fontBlock = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
        $brushBlockText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(212, 212, 216))

        # Box 1
        $b1X = $cardX + 60
        $b1Y = $cardY + 280
        $bW = 500
        $bH = 240
        $brushPillBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 24, 27))
        $g.FillRectangle($brushPillBg, $b1X, $b1Y, $bW, $bH)
        $g.DrawRectangle($penCard, $b1X, $b1Y, $bW, $bH)
        $g.DrawString("Agreed Terms & Scope Ledger", $fontCardHeader, $brushTag, $b1X + 20, $b1Y + 20)
        $ledgerText = "Deliverable: Next.js + Tailwind web application`nFixed Milestone: `$1,200 (Funded in escrow)`nRevisions Allowed: 2 major iterations`nDue Date: Friday 5:00 PM EST`nStatus: On Track (Verified by Memoreply)"
        $g.DrawString($ledgerText, $fontBlock, $brushBlockText, $b1X + 20, $b1Y + 55)

        # Box 2
        $b2X = $cardX + 600
        $b2Y = $cardY + 280
        $g.FillRectangle($brushPillBg, $b2X, $b2Y, $bW, $bH)
        $g.DrawRectangle($penCard, $b2X, $b2Y, $bW, $bH)
        $brushIndigo = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(129, 140, 248))
        $g.DrawString("1-Click Response Composer", $fontCardHeader, $brushIndigo, $b2X + 20, $b2Y + 20)
        $replyText = "Selected: Polite Scope Clarification`n`n`"Hi there! Looking at our initial agreement, adding this payment module is outside our current scope. I'd be happy to prepare a separate add-on quote for this!`"`n`n[Insert into Chat]  *  [Adjust Tone]"
        $g.DrawString($replyText, $fontBlock, $brushBlockText, $b2X + 20, $b2Y + 55)
    }

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Created: $outPath"
}

Create-Promo 1280 800 "C:\Users\Hassaan\Desktop\Extention\store_assets\screenshot-1-overview.png" "Memoreply - Replies That Remember" "Deterministic context engine & response ledger for client conversations."
Create-Promo 440 280 "C:\Users\Hassaan\Desktop\Extention\store_assets\small-promo-440x280.png" "" ""
Create-Promo 1400 560 "C:\Users\Hassaan\Desktop\Extention\store_assets\marquee-promo-1400x560.png" "" ""

$bmpLogo.Dispose()

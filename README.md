# Supernote Stock Quote Plugin

A handwritten stock-ticker recognition and quote lookup plugin for Supernote.

This plugin lets you write a ticker symbol in a Supernote note, lasso it, and open a market quote without leaving the note. You can view the quote in a clean popup and optionally insert the quote information into the note.

![Stock Quote plugin on Supernote](screenshots/stock-quote.png)

## Features

- Recognizes handwritten stock ticker symbols such as `AAPL`, `MSFT`, and `PFE`
- Retrieves an online market quote
- Displays company name, current price, change, daily high/low, previous close, market/exchange, and update time when available
- Lets you insert the quote into the current Supernote note
- Includes a **Dismiss** button when you only want to view the quote
- Handles common ticker formats such as `$MSFT` and class-share symbols
- Includes the **Supernote Corner Method** so handwriting near the lower corners can still be recognized on affected A5X devices
- Designed for Supernote's lasso workflow and e-ink display

## Installation

1. Download the latest `.snplg` file from the repository's **Releases** folder or GitHub Releases page.
2. Copy the `.snplg` file to your Supernote device using the same method you normally use for installing Supernote plugins.
3. Install the plugin on the Supernote.
4. Open a note and use the lasso tool. **Stock Quote** should appear as a lasso action.

The plugin needs Internet access to retrieve quote data. The first time it needs network access, Supernote may ask you to allow the plugin's Internet permission.

## How to Use

1. In a Supernote note, handwrite a stock ticker such as `AAPL`.
2. Use the lasso tool to select the ticker.
3. Tap **Stock Quote** in the lasso menu.
4. The recognized ticker appears in the popup and the current quote is retrieved.
5. Tap **Insert Quote** to place the quote into your note, or tap **Dismiss** to close the popup without changing the note.

If handwriting recognition is imperfect, you can correct the ticker in the text field and tap **Quote** again.

## Supernote Corner Method

On some A5X configurations, Supernote reports a 1404 × 1872 display/page while lasso strokes use the newer EMR coordinate range (approximately `maxX=20967`, `maxY=15725`). Passing the reported display size directly to `recognizeElements()` can cause OCR to fail for handwriting near the lower corners.

This plugin detects that wider EMR range and tries a 1920 × 2560 recognition coordinate space first. This workaround is referred to in this project as the **Supernote Corner Method**.

## Quote Data

The plugin retrieves market data from Yahoo Finance chart endpoints. Quotes may be delayed and availability of individual fields can vary by symbol and market. This project is not affiliated with or endorsed by Yahoo or Supernote.

## Compatibility

This release was developed and tested on a Supernote A5X running firmware 2.26.39. The project intentionally uses the older compatible Supernote plugin API generation for that device/firmware combination.

## Source Code

The source is included in this repository. The project uses React Native and `sn-plugin-lib`.

## Status

The plugin is working and usable, but it remains a community project. Bug reports and improvements are welcome.

## Author

Robert Hammond

## License

MIT License. See [LICENSE](LICENSE).

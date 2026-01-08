# 🏹 Robin Wood

> **Stealing from the rich (LLM providers) to give to the poor (you)**

[![npm version](https://badge.fury.io/js/%40robin-wood%2Fcore.svg)](https://www.npmjs.com/package/@robin-wood/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Your LLM bill is **highway robbery**. Audio files with 2 minutes of silence? **$$$** Text with unnecessary whitespace? **$$$** Images at 4K when the model can't even see that well? **$$$**

Robin Wood compresses your audio, text, and images **before** you send them to OpenAI, Anthropic, or whoever is charging you $20/million tokens.

**We steal bytes. You save money. Sam Altman cries.**

## 💸 Why you need this

- That 5-minute voice memo? **70% silence**. You're paying for air.
- Your markdown? **Full of `\n\n\n\n`**. You're paying for nothing.
- That screenshot? **4K**. The AI doesn't care.

LLM providers charge per token/byte. Robin Wood cuts the fat. **Keep the signal, drop the noise.**

## 🚀 Installation

```bash
npm install robin-wood
```

## 🎯 Usage (it's dead simple)

```typescript
import steal from 'robin-wood';

// Audio: Remove silence, speed up, normalize
const audio = await steal
  .audio(yourAudioBuffer)
  .removeSilence(-40, 100)  // Remove silence below -40dB
  .speedup(1.2)              // 20% faster
  .normalize()               // Balance volume
  .run();

console.log(`Saved ${audio.duration}s of your money`);

// Text: Trim whitespace, minify
const text = await steal
  .text("  Too    many   spaces    ")
  .trim()
  .minify()
  .run();

console.log(`Compression ratio: ${text.ratio}x`);

// Image: Resize, compress
const image = await steal
  .image(bigAssImage)
  .resize(800, 600)
  .compress(85)
  .run();
```

## 🎪 What it does

### Audio Pipeline
- **`speedup(rate)`**: Make it faster without chipmunk effect (1.1x - 2x recommended)
- **`removeSilence()`**: Delete awkward pauses. Save tokens. Save face.
- **`normalize()`**: Balance audio levels
- **`volume(level)`**: Adjust volume (0.0 - 2.0)

### Text Pipeline
- **`trim()`**: Kill unnecessary whitespace
- **`minify()`**: Compress text structure
- **`compress()`**: gzip/brotli compression

### Image Pipeline  
- **`resize(w, h)`**: LLMs don't need your 4K screenshot
- **`compress(quality)`**: JPEG compression (0-100)

## 💡 Real Talk

This library doesn't do magic. It does the **obvious optimizations** you should've been doing anyway:

1. ✂️ Removes silence from audio (why pay for dead air?)
2. 🗜️ Compresses text (LLMs don't care about your double newlines)
3. 📉 Downsizes images (GPT-4 Vision has a resolution limit anyway)

**Result?** 30-70% cost reduction on typical payloads. YMMV.

## 🏹 Philosophy

We named it Robin Wood because:
1. **Robin Hood** stole from the rich to give to the poor
2. **We steal bytes** from bloated files to save your money
3. **Wood** sounds like "would" ("Robin would save you money")
4. We thought it was funny at 2 AM

The main function is called `steal()`. Because that's what we do.

## 📚 API Reference

### Audio

```typescript
steal.audio(buffer: Buffer | ArrayBuffer | Uint8Array)
  .speedup(rate: number)              // 0.1 - 4.0
  .removeSilence(thresholdDb, minMs)  // Default: -40dB, 100ms
  .normalize()                        // Balance volume
  .volume(level: number)              // 0.0 - 2.0
  .run()
```

**Important**: Pass **raw PCM Float32** data, not MP3/WAV files. Decode first.

Returns: `{ data: Buffer, duration: number, sampleRate: number }`

### Text

```typescript
steal.text(string)
  .trim()                    // Remove whitespace
  .minify()                  // Minify structure  
  .compress('gzip' | 'brotli')
  .run()
```

Returns: `{ data: string, ratio: number }`

### Image

```typescript
steal.image(buffer)
  .resize(width, height)
  .compress(quality: number)  // 0-100
  .run()
```

Returns: `{ data: Buffer, width: number, height: number }`

## 🤔 FAQ

**Q: Will this break my audio/text/images?**  
A: No. Everything is lossless except where you explicitly compress. Test before production.

**Q: How much will I save?**  
A: Depends on your data. Typical savings: 30-70% on audio with silence, 10-30% on text, 50-80% on images.

**Q: Is this just a wrapper around ffmpeg?**  
A: No. Pure JavaScript/TypeScript. No external dependencies. Runs anywhere Node runs.

**Q: Can I use this with OpenAI/Anthropic/etc?**  
A: Yes. Process your data with Robin Wood, then send to any LLM API.

**Q: Does this work in the browser?**  
A: Not yet. Node.js only for now. Browser support coming soon™.

## 🎯 Who this is for

- Developers sending audio to Whisper API
- Apps using GPT-4 Vision with user-uploaded images  
- Anyone paying $20/million tokens and crying about it
- People who like stealing from billionaires (legally)

## 🚫 Who this is NOT for

- People who don't care about LLM costs (lucky you)
- Apps that need lossless audio (use FLAC)
- Anyone who thinks "optimize" is a buzzword

## 📦 Requirements

- Node.js >= 16
- A burning desire to pay less money

## 🤝 Contributing

PRs welcome. Add more compression strategies. Make it faster. Make Sam Altman's yacht smaller.

## 📄 License

MIT - Steal freely (see what we did there?)

## 🔗 Links

- [NPM](https://www.npmjs.com/package/@robin-wood/core)
- [GitHub](https://github.com/gustavonobg/robin-wood)
- [Issues](https://github.com/gustavonobg/robin-wood/issues) (tell us what broke)

---

**Made by developers tired of paying $200/month for API calls** 🏹

*"In Sherwood Forest, we compressed the Sheriff's taxes. In Silicon Valley, we compress your tokens."*


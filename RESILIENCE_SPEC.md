# Device Loss Handling & Context Re-acquisition

### Asynchronous Device Lost Handling
- Bound `device.lost` promise handler with exponential backoff re-initialization loop.
- Preserved CPU-side scene graph and re-uploaded pipeline state without page reload.


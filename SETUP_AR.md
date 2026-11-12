# الخطوات (كلها من الموبايل، من غير كارت)
1. Firebase: Authentication > Email/Password مفعّل (ده كفاية، مش محتاج Blaze ولا Firestore).
2. Cloudflare: اعمل حساب مجاني، وخد منه Account ID، واعمل API Token بقالب "Edit Cloudflare Workers".
3. GitHub: ارفع المشروع (Private) وضيف Secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
4. شغّل workflow "Deploy API (Cloudflare)". هيطلعلك رابط الـ API (…workers.dev). ضيفه Secret باسم API_URL.
5. AdMob: ضيف التطبيق، اعمل Rewarded unit، فعّل SSV برابط: API_URL/ssv ، وضيف Secrets: ADMOB_APP_ID, KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS.
6. شغّل workflow "Build Prize Master APK" ونزّل الـ APK.
7. سجّل بإيميلك وأكّده: هتبقى أنت الأدمن تلقائيًا.

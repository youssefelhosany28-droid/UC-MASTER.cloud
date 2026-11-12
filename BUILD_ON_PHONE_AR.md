# بناء Prize Master APK من الموبايل

1. أنشئ مستودع GitHub جديدًا باسم `uc-master-android` واجعله Private.
2. فك ضغط الملف ZIP على هاتفك.
3. ارفع محتويات مجلد `uc_master` إلى جذر المستودع، مع إظهار الملفات المخفية حتى ترفع مجلد `.github` وملف workflow.
4. افتح تبويب Actions في المستودع ووافق على تفعيل GitHub Actions إذا طُلب ذلك.
5. افتح workflow باسم Build Prize Master APK واضغط Run workflow.
6. بعد نجاح البناء افتح تشغيل الـ workflow ثم قسم Artifacts ونزّل `PRIZE-MASTER-debug-APK`.
7. فك ضغط ملف Artifact ثم ثبّت `app-debug.apk` بعد السماح بالتثبيت من هذا المصدر.

ملاحظات:
- هذا APK تجريبي Debug للتثبيت والاختبار، وليس إصدارًا للنشر على Google Play.
- لا تضع مفاتيح Firebase Admin أو service-account داخل المستودع.
- تأكد من أن Firebase Authorized domains وقواعد Firestore مضبوطة قبل استخدام التطبيق.
- الإعلانات والكوينز واستبدال UC غير مفعّلة تلقائيًا؛ تحتاج مزود مكافآت مسموحًا ومصدر UC رسميًا وتمويلًا فعليًا.

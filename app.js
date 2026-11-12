import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
const API="__API_URL__";

// 1) Replace these values with your Firebase project's web-app config.
const firebaseConfig = {
  apiKey: "AIzaSyCehb9U5-8roEAjhl9XVVdySTTnIhtPIU8",
  authDomain: "uc-master-website.firebaseapp.com",
  projectId: "uc-master-website",
  storageBucket: "uc-master-website.firebasestorage.app",
  messagingSenderId: "959903428401",
  appId: "1:959903428401:web:ae226648dbcf8d78c28a10",
  measurementId: "G-C0SGYYL77V"
};
const configured = !Object.values(firebaseConfig).some(v => String(v).includes("YOUR_"));
let auth;
if (configured) { const app=initializeApp(firebaseConfig); auth=getAuth(app); }

const $=id=>document.getElementById(id);
let mode="login", currentUser=null, selectedReward="";
const translations={
 ar:{logout:"تسجيل الخروج",tagline:"اجمع النقاط واستبدلها بمكافآت.",welcome:"أهلاً بيك",login:"دخول",signup:"إنشاء حساب",email:"البريد الإلكتروني",password:"كلمة مرور جديدة للموقع",privacy:"كلمة المرور خاصة بموقع Prize Master وليست كلمة مرور Gmail.",dashboard:"لوحة التحكم",hello:"أهلاً،",accountActive:"الحساب نشط",yourBalance:"رصيدك الحالي",coins:"كوينز",balanceNote:"الرصيد يتحدث بعد تأكيد المهام المؤهلة.",earnTitle:"اجمع كوينز",earnText:"المهام والإعلانات المؤهلة ستظهر هنا بعد ربط مزود متوافق.",comingSoon:"قريباً",storeTitle:"متجر المكافآت",storeText:"اختر المكافأة وقدّم طلبك باستخدام PUBG ID فقط.",browse:"تصفح المكافآت",rewards:"المكافآت",storeDisclaimer:"الأسعار والخيارات تجريبية لحين اعتماد مصدر شحن رسمي وتمويل المكافآت.",pubgReward:"PUBG Mobile",request:"طلب",history:"طلباتي",noRequests:"لا توجد طلبات حتى الآن.",admin:"لوحة المدير",adminNote:"تظهر فقط للحساب الذي منحه الخادم صلاحية المدير.",requestReward:"طلب مكافأة",pubgId:"PUBG ID",idOnly:"أدخل PUBG ID فقط. لا تشارك كلمة مرور حسابك.",cancel:"إلغاء",sendRequest:"إرسال الطلب",footer:"نسخة أولية قيد التطوير"},
 en:{logout:"Log out",tagline:"Earn points and redeem rewards.",welcome:"Welcome",login:"Log in",signup:"Create account",email:"Email address",password:"New password for this site",privacy:"This password is for Prize Master, not your Gmail password.",dashboard:"DASHBOARD",hello:"Hello,",accountActive:"Account active",yourBalance:"Your balance",coins:"Coins",balanceNote:"Balance updates after eligible tasks are verified.",earnTitle:"Earn coins",earnText:"Eligible tasks and ads will appear here after a compliant provider is connected.",comingSoon:"Coming soon",storeTitle:"Rewards store",storeText:"Choose a reward and submit a request using PUBG ID only.",browse:"Browse rewards",rewards:"Rewards",storeDisclaimer:"Prices and options are placeholders until an authorized top-up source and reward funding are confirmed.",pubgReward:"PUBG Mobile",request:"Request",history:"My requests",noRequests:"No requests yet.",admin:"Admin dashboard",adminNote:"Visible only to an account granted admin privileges by the server.",requestReward:"Request reward",pubgId:"PUBG ID",idOnly:"Enter PUBG ID only. Never share your account password.",cancel:"Cancel",sendRequest:"Send request",footer:"Early version in development"}
};
let lang="ar";
function setLang(){document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(translations[lang][k])el.textContent=translations[lang][k]});$("langBtn").textContent=lang==="ar"?"EN":"عربي"}
$("langBtn").onclick=()=>{lang=lang==="ar"?"en":"ar";setLang()};
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",3500)}
function showMode(m){mode=m;$("loginTab").classList.toggle("active",m==="login");$("signupTab").classList.toggle("active",m==="signup");$("authSubmit").textContent=translations[lang][m];$("authTitle").textContent=translations[lang][m==="login"?"welcome":"signup"]}
$("loginTab").onclick=()=>showMode("login");$("signupTab").onclick=()=>showMode("signup");
$("authForm").addEventListener("submit",async e=>{e.preventDefault();$("authMsg").textContent="";if(!configured){$("authMsg").textContent=lang==="ar"?"اربط Firebase أولاً باتباع ملف README.":"Connect Firebase first using README.";return}
 try{const email=$("email").value.trim(),password=$("password").value;if(mode==="signup"){const cred=await createUserWithEmailAndPassword(auth,email,password);await sendEmailVerification(cred.user);$("authMsg").textContent=lang==="ar"?"تم إنشاء الحساب. راجع بريدك لتأكيده.":"Account created. Check your email to verify it."}else{await signInWithEmailAndPassword(auth,email,password)}}catch(err){$("authMsg").textContent=err.message}});
$("logoutBtn").onclick=()=>signOut(auth);
onAuthStateChangedSafe();
function onAuthStateChangedSafe(){if(!configured)return;onAuthStateChanged(auth,async user=>{currentUser=user;$("authView").classList.toggle("hidden",!!user);$("appView").classList.toggle("hidden",!user);$("logoutBtn").classList.toggle("hidden",!user);if(!user)return;$("userEmail").textContent=user.email||"";startPolling()})}
$("openStore").onclick=()=>$("storeSection").classList.toggle("hidden");
document.querySelectorAll(".request").forEach(btn=>btn.onclick=()=>{selectedReward=btn.dataset.reward;$("chosenReward").textContent=selectedReward;$("requestDialog").showModal()});
$("requestForm").addEventListener("submit",async e=>{e.preventDefault();if(!configured||!currentUser)return;const id=$("pubgId").value.trim();if(!/^[0-9]{5,20}$/.test(id)){toast(lang==="ar"?"تأكد من PUBG ID.":"Check PUBG ID.");return}
 try{await api("/api/redeem","POST",{reward:selectedReward,pubgId:id});refresh();$("requestDialog").close();$("pubgId").value="";toast(lang==="ar"?"تم إرسال الطلب للمراجعة.":"Request submitted for review.")}catch(err){toast(err.message)}});
setLang();
if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});

// ---- AdMob rewarded ads (Capacitor plugin, native only) ----
const REWARDED_ID="ca-app-pub-3940256099942544/5224354917"; // TEST id: replace with yours
const AdMob=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AdMob;
let adsReady=false;
async function initAds(){if(!AdMob||adsReady)return;try{await AdMob.initialize({});adsReady=true}catch{}}
$("watchAd").onclick=async()=>{
  if(!AdMob||!currentUser){toast(lang==="ar"?"الإعلانات بتشتغل في التطبيق بس.":"Ads work in the app only.");return}
  try{await initAds();await AdMob.prepareRewardVideoAd({adId:REWARDED_ID,isTesting:true,ssv:{userId:currentUser.uid}});await AdMob.showRewardVideoAd();toast(lang==="ar"?"الكوينات هتتضاف خلال ثواني.":"Coins will be added in a few seconds.");setTimeout(refresh,4000);setTimeout(refresh,10000)}
  catch(e){toast(lang==="ar"?"مفيش إعلان متاح دلوقتي.":"No ad available now.")}};

// ---- Cloudflare Worker API ----
async function api(path,method="GET",body){const t=await currentUser.getIdToken();const r=await fetch(API+path,{method,headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"error");return j}
let pollTimer=null;
function startPolling(){refresh();clearInterval(pollTimer);pollTimer=setInterval(refresh,10000)}
async function refresh(){if(!currentUser)return;try{const me=await api("/api/me");$("coinBalance").textContent=me.coins;
  const box=$("requestsList");box.innerHTML="";if(!me.orders.length)box.textContent=translations[lang].noRequests;
  me.orders.forEach(x=>{const row=document.createElement("div");row.className="reward";const a=document.createElement("b"),b=document.createElement("span");a.textContent=x.reward+" • "+x.pubg_id;b.textContent=x.status;row.append(a,b);box.append(row)});
  $("adminSection").classList.toggle("hidden",!me.isAdmin);
  if(me.isAdmin){const o=await api("/api/admin/orders"),ab=$("adminRequests");ab.innerHTML="";o.orders.forEach(x=>{const row=document.createElement("div");row.className="reward";const s=document.createElement("span");s.textContent=`${x.reward} | ${x.pubg_id} | ${x.email}`;const ok=document.createElement("button"),no=document.createElement("button");ok.textContent="✅";no.textContent="❌";ok.onclick=()=>review(x.id,"done");no.onclick=()=>review(x.id,"rejected");row.append(s,ok,no);ab.append(row)})}
}catch(e){}}
async function review(id,action){try{await api("/api/admin/review","POST",{id,action});refresh()}catch(e){toast(e.message)}}

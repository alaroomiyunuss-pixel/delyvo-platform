/* Delyvo — Restaurant partner panel.
   Frontend-only: reads/mutates the shared store (window.DV), live-synced across tabs.
   Views: orders board (kanban) · prep list · labels/stickers · my menu · performance. */
(function () {
  'use strict';
  const W = typeof window !== 'undefined' ? window : globalThis;
  const DV = W.DV, DVUI = W.DVUI;
  const esc = DV.esc;
  const HAS_DOM = typeof document !== 'undefined' && !!document.getElementById;

  // ---------------------------------------------------------------- prefs
  const pref = {
    get(k) { try { return localStorage.getItem('delyvo.restaurant.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('delyvo.restaurant.' + k, v); } catch (e) {} }
  };
  let lang = ['nl', 'en'].includes(pref.get('lang')) ? pref.get('lang') : 'ar';
  let soundOn = pref.get('sound') !== '0';
  let rid = null;
  let markSeen = () => {};

  const VIEWS = ['board', 'prep', 'labels', 'menu', 'stats'];
  const SIZES = { '62x40': [62, 40], '62x60': [62, 60], '100x62': [100, 62] };
  const ui = {
    view: VIEWS.includes(pref.get('view')) ? pref.get('view') : 'board',
    date: DV.today(), slot: 'all', q: '',
    sel: new Set(), drawer: null, drawerNew: false, notifOpen: false,
    size: SIZES[pref.get('size')] ? pref.get('size') : '62x40',
    bags: pref.get('bags') === '1', lblFilter: 'all',
    loginR: null, pin: '', pinErr: false, pending: null
  };

  // ---------------------------------------------------------------- i18n
  const T = {
    ar: {
      app: 'لوحة المطعم', partner: 'بوابة الشركاء',
      login_h: 'دخول شريك المطعم', login_sub: 'اختر مطعمك ثم أدخل رمز PIN للدخول إلى لوحة المطبخ',
      pick_r: 'اختر المطعم', pin: 'رمز PIN', pin_hint: 'PIN التجريبي: 1234', enter: 'دخول', wrong_pin: 'رمز PIN غير صحيح', choose_first: 'اختر المطعم أولاً',
      login_foot: 'بيانات تجريبية — متزامنة لحظياً مع تطبيق العميل والسائق والإدارة',
      nav_board: 'الطلبات', nav_prep: 'ملخص التحضير', nav_labels: 'الاستكرات', nav_menu: 'قائمتي', nav_stats: 'الأداء',
      sub_board: 'لوحة الطلبات حسب الحالة', sub_prep: 'الكميات المطلوبة لكل وجبة', sub_labels: 'طباعة ملصقات الوجبات والأكياس', sub_menu: 'وجباتك المعروضة للعملاء', sub_stats: 'الأرقام والتقييمات والمستحقات',
      today: 'اليوم', tomorrow: 'غداً', after: 'بعد غد', logout: 'تسجيل الخروج',
      col_scheduled: 'مؤكدة — بانتظار التحضير', col_accepted: 'مؤكدة', col_preparing: 'قيد التحضير', col_ready: 'جاهزة للتسليم', col_done: 'تم الاستلام',
      accept: 'قبول', start_prep: 'بدء التحضير', mark_ready: 'جاهز', accept_all: 'قبول الكل', prep_all: 'بدء تحضير الكل', ready_all: 'تجهيز الكل',
      all: 'الكل', lunch: 'غداء', dinner: 'عشاء', search: 'ابحث برقم الطلب أو اسم العميل أو الوجبة…',
      chef: 'اختيار الشيف', printed: 'تمت طباعة الاستكر', not_printed: 'غير مطبوع', empty_col: 'لا توجد طلبات هنا',
      conflict: 'تعارض مع الوجبة!', waiting_driver: 'بانتظار السائق', driver: 'السائق', no_driver: 'لم يُسند سائق بعد',
      k_total: 'إجمالي الوجبات', k_lunch: 'غداء', k_dinner: 'عشاء', k_alg: 'تنبيهات حساسية', k_unprinted: 'بدون استكر', k_ready: 'جاهزة/مُسلّمة',
      print_unprinted: 'طباعة غير المطبوعة فقط', print_selected: 'طباعة الاستكرات', preview: 'معاينة', bag_labels: 'ملصقات الأكياس', with_bags: 'إضافة ملصق كيس لكل عميل',
      select_all: 'تحديد الكل', selected: (n) => `${n} محدد`, size: 'مقاس الاستكر', f_all: 'الكل', f_unprinted: 'غير المطبوعة', f_printed: 'المطبوعة',
      th_no: 'رقم الطلب', th_slot: 'الوجبة', th_window: 'فترة التوصيل', th_cust: 'العميل', th_meal: 'الصنف', th_status: 'الحالة', th_printed: 'استكر',
      no_orders: 'لا توجد طلبات لهذا اليوم', no_orders_sub: 'الطلبات تظهر هنا فور اشتراك العملاء واختيار وجباتك',
      nothing_sel: 'حدد طلباً واحداً على الأقل', nothing_unprinted: 'كل الاستكرات مطبوعة ✓',
      prev_h: 'معاينة الاستكرات', prev_bags_h: 'معاينة ملصقات الأكياس', print: 'طباعة', close: 'إغلاق', labels_n: (n) => `${n} ملصق`,
      printed_ok: 'تم تحديد الطلبات كمطبوعة', printed_ok_sub: (n) => `${n} استكر`,
      prep_h: 'ملخص التحضير', prep_meal: 'الوجبة', total: 'المجموع', kcal: 'سعرات', print_prep: 'طباعة الملخص',
      special: 'ملاحظات خاصة — حساسية العملاء', special_none: 'لا توجد حساسية مسجّلة لعملاء هذا اليوم', cust_alg: 'حساسية العميل', meal_contains: 'الوجبة تحتوي',
      prep_status: 'حالة التقدم', generated: 'أُنشئ في',
      menu_h: 'قائمتي', active_of: (a, b) => `${a} من ${b} وجبة مفعّلة`, menu_note: 'الوجبات المعطّلة تختفي فوراً من تطبيق العميل ولا تُقترح في اختيار الشيف.',
      plans: 'الباقات', allergens: 'مسببات الحساسية', none: 'لا يوجد', edit: 'تعديل', active: 'مفعّلة', inactive: 'معطّلة', reviews: 'تقييم',
      edit_h: 'تعديل الوجبة', protein: 'بروتين (غ)', carbs: 'كربوهيدرات (غ)', fat: 'دهون (غ)', kcal_f: 'السعرات (kcal)', shelf: 'مدة الصلاحية (أيام)',
      desc_ar: 'الوصف (عربي)', desc_nl: 'الوصف (هولندي)', save: 'حفظ التعديلات', cancel: 'إلغاء', saved: 'تم حفظ الوجبة', meal_on: 'الوجبة مفعّلة', meal_off: 'الوجبة معطّلة — مخفية عن العملاء',
      st_today: 'طلبات اليوم', st_done_today: 'سُلّمت اليوم', st_week: 'وجبات مُسلّمة (٧ أيام)', st_rating: 'متوسط التقييم', st_payout: 'المستحقات التقديرية', st_month: (m) => `هذا الشهر · ${m}`,
      st_chart: 'الوجبات المُسلّمة — آخر ٧ أيام', st_top: 'الأكثر طلباً (٣٠ يوماً)', st_low: 'تقييمات منخفضة وتعليقات', st_low_none: 'لا توجد تقييمات منخفضة — عمل رائع 👏',
      st_payout_calc: (n, p) => `${n} وجبة × ${p}`, per_meal: 'لكل وجبة', no_comment: 'بدون تعليق',
      notif: 'الإشعارات', mark_all: 'تحديد الكل كمقروء', notif_none: 'لا توجد إشعارات',
      sound_on: 'الصوت مفعّل', sound_off: 'الصوت مكتوم',
      d_order: 'تفاصيل الطلب', d_customer: 'العميل', d_delivery: 'التوصيل', d_meal: 'الوجبة', d_ingr: 'المكونات', d_history: 'سجل الحالة', d_macros: 'القيم الغذائية', d_print: 'طباعة الاستكر',
      city: 'المدينة', date: 'التاريخ',
      moved: 'تم تحديث الحالة', moved_n: (n) => `${n} طلب`,
      new_orders: 'طلبات جديدة',
      // label
      l_alg: 'مسببات الحساسية', l_cust: '⚠ حساسية العميل', l_prod: 'تاريخ الإنتاج', l_exp: 'صالح حتى', l_cold: 'يحفظ مبرداً 0–4°C', l_none: 'لا يوجد',
      bag: 'كيس التوصيل', bag_items: (n) => `${n} وجبة في الكيس`
    },
    nl: {
      app: 'Restaurantpaneel', partner: 'Partnerportaal',
      login_h: 'Inloggen partnerrestaurant', login_sub: 'Kies je restaurant en voer je pincode in om het keukenpaneel te openen',
      pick_r: 'Kies restaurant', pin: 'Pincode', pin_hint: 'Demo-pincode: 1234', enter: 'Inloggen', wrong_pin: 'Onjuiste pincode', choose_first: 'Kies eerst een restaurant',
      login_foot: 'Demodata — live gesynchroniseerd met klant-, bezorger- en admin-app',
      nav_board: 'Bestellingen', nav_prep: 'Productielijst', nav_labels: 'Etiketten', nav_menu: 'Mijn menu', nav_stats: 'Prestaties',
      sub_board: 'Bestellingen per status', sub_prep: 'Aantallen per gerecht', sub_labels: 'Maaltijd- en tasetiketten printen', sub_menu: 'Je gerechten voor klanten', sub_stats: 'Cijfers, beoordelingen en uitbetaling',
      today: 'Vandaag', tomorrow: 'Morgen', after: 'Overmorgen', logout: 'Uitloggen',
      col_scheduled: 'Bevestigd — te bereiden', col_accepted: 'Bevestigd', col_preparing: 'In bereiding', col_ready: 'Klaar voor ophalen', col_done: 'Opgehaald',
      accept: 'Accepteren', start_prep: 'Start bereiding', mark_ready: 'Klaar', accept_all: 'Alles accepteren', prep_all: 'Alles starten', ready_all: 'Alles klaar',
      all: 'Alles', lunch: 'Lunch', dinner: 'Diner', search: 'Zoek op bestelnr., klant of gerecht…',
      chef: 'Keuze van de chef', printed: 'Etiket geprint', not_printed: 'Niet geprint', empty_col: 'Geen bestellingen',
      conflict: 'Conflict met gerecht!', waiting_driver: 'Wacht op bezorger', driver: 'Bezorger', no_driver: 'Nog geen bezorger',
      k_total: 'Totaal maaltijden', k_lunch: 'Lunch', k_dinner: 'Diner', k_alg: 'Allergie-meldingen', k_unprinted: 'Zonder etiket', k_ready: 'Klaar/opgehaald',
      print_unprinted: 'Alleen niet-geprinte', print_selected: 'Etiketten printen', preview: 'Voorbeeld', bag_labels: 'Tasetiketten', with_bags: 'Tasetiket per klant toevoegen',
      select_all: 'Alles selecteren', selected: (n) => `${n} geselecteerd`, size: 'Etiketformaat', f_all: 'Alles', f_unprinted: 'Niet geprint', f_printed: 'Geprint',
      th_no: 'Bestelnr.', th_slot: 'Moment', th_window: 'Tijdvak', th_cust: 'Klant', th_meal: 'Gerecht', th_status: 'Status', th_printed: 'Etiket',
      no_orders: 'Geen bestellingen voor deze dag', no_orders_sub: 'Bestellingen verschijnen hier zodra klanten je gerechten kiezen',
      nothing_sel: 'Selecteer minstens één bestelling', nothing_unprinted: 'Alle etiketten zijn geprint ✓',
      prev_h: 'Voorbeeld etiketten', prev_bags_h: 'Voorbeeld tasetiketten', print: 'Printen', close: 'Sluiten', labels_n: (n) => `${n} etiket(ten)`,
      printed_ok: 'Bestellingen gemarkeerd als geprint', printed_ok_sub: (n) => `${n} etiket(ten)`,
      prep_h: 'Productielijst', prep_meal: 'Gerecht', total: 'Totaal', kcal: 'kcal', print_prep: 'Lijst printen',
      special: 'Bijzonderheden — allergieën klanten', special_none: 'Geen allergieën bij klanten van vandaag', cust_alg: 'Allergie klant', meal_contains: 'Gerecht bevat',
      prep_status: 'Voortgang', generated: 'Gemaakt om',
      menu_h: 'Mijn menu', active_of: (a, b) => `${a} van ${b} gerechten actief`, menu_note: 'Inactieve gerechten verdwijnen direct uit de klant-app en worden niet door de chef gekozen.',
      plans: 'Pakketten', allergens: 'Allergenen', none: 'Geen', edit: 'Bewerken', active: 'Actief', inactive: 'Inactief', reviews: 'beoordelingen',
      edit_h: 'Gerecht bewerken', protein: 'Eiwit (g)', carbs: 'Koolhydraten (g)', fat: 'Vet (g)', kcal_f: 'Energie (kcal)', shelf: 'Houdbaarheid (dagen)',
      desc_ar: 'Omschrijving (Arabisch)', desc_nl: 'Omschrijving (Nederlands)', save: 'Opslaan', cancel: 'Annuleren', saved: 'Gerecht opgeslagen', meal_on: 'Gerecht actief', meal_off: 'Gerecht inactief — verborgen voor klanten',
      st_today: 'Bestellingen vandaag', st_done_today: 'Vandaag opgehaald', st_week: 'Bezorgde maaltijden (7 dagen)', st_rating: 'Gem. beoordeling', st_payout: 'Geschatte uitbetaling', st_month: (m) => `Deze maand · ${m}`,
      st_chart: 'Bezorgde maaltijden — laatste 7 dagen', st_top: 'Meest besteld (30 dagen)', st_low: 'Lage beoordelingen & opmerkingen', st_low_none: 'Geen lage beoordelingen — top werk 👏',
      st_payout_calc: (n, p) => `${n} maaltijden × ${p}`, per_meal: 'per maaltijd', no_comment: 'Geen opmerking',
      notif: 'Meldingen', mark_all: 'Alles gelezen', notif_none: 'Geen meldingen',
      sound_on: 'Geluid aan', sound_off: 'Geluid uit',
      d_order: 'Bestelling', d_customer: 'Klant', d_delivery: 'Bezorging', d_meal: 'Gerecht', d_ingr: 'Ingrediënten', d_history: 'Statusgeschiedenis', d_macros: 'Voedingswaarde', d_print: 'Etiket printen',
      city: 'Plaats', date: 'Datum',
      moved: 'Status bijgewerkt', moved_n: (n) => `${n} bestelling(en)`,
      new_orders: 'Nieuwe bestellingen',
      l_alg: 'Allergenen', l_cust: '⚠ Allergie klant', l_prod: 'Productiedatum', l_exp: 'Houdbaar tot', l_cold: 'Gekoeld bewaren 0–4°C', l_none: 'Geen',
      bag: 'Bezorgtas', bag_items: (n) => `${n} maaltijd(en) in de tas`
    },
    en: {
      app: 'Restaurant panel', partner: 'Partner portal',
      login_h: 'Partner restaurant login', login_sub: 'Choose your restaurant and enter your PIN to open the kitchen panel',
      pick_r: 'Choose restaurant', pin: 'PIN', pin_hint: 'Demo PIN: 1234', enter: 'Log in', wrong_pin: 'Incorrect PIN', choose_first: 'Choose a restaurant first',
      login_foot: 'Demo data — live-synced with the customer, driver and admin apps',
      nav_board: 'Orders', nav_prep: 'Prep list', nav_labels: 'Labels', nav_menu: 'My menu', nav_stats: 'Performance',
      sub_board: 'Orders by status', sub_prep: 'Quantities per dish', sub_labels: 'Print meal and bag labels', sub_menu: 'Your dishes shown to customers', sub_stats: 'Numbers, ratings and payout',
      today: 'Today', tomorrow: 'Tomorrow', after: 'Day after', logout: 'Log out',
      col_scheduled: 'Confirmed — to prepare', col_accepted: 'Confirmed', col_preparing: 'Preparing', col_ready: 'Ready for pickup', col_done: 'Picked up',
      accept: 'Accept', start_prep: 'Start prep', mark_ready: 'Ready', accept_all: 'Accept all', prep_all: 'Start all', ready_all: 'All ready',
      all: 'All', lunch: 'Lunch', dinner: 'Dinner', search: 'Search by order no., customer or dish…',
      chef: "Chef's pick", printed: 'Label printed', not_printed: 'Not printed', empty_col: 'No orders here',
      conflict: 'Conflicts with dish!', waiting_driver: 'Waiting for driver', driver: 'Driver', no_driver: 'No driver assigned yet',
      k_total: 'Total meals', k_lunch: 'Lunch', k_dinner: 'Dinner', k_alg: 'Allergy alerts', k_unprinted: 'No label', k_ready: 'Ready/picked up',
      print_unprinted: 'Unprinted only', print_selected: 'Print labels', preview: 'Preview', bag_labels: 'Bag labels', with_bags: 'Add a bag label per customer',
      select_all: 'Select all', selected: (n) => `${n} selected`, size: 'Label size', f_all: 'All', f_unprinted: 'Unprinted', f_printed: 'Printed',
      th_no: 'Order no.', th_slot: 'Meal', th_window: 'Time window', th_cust: 'Customer', th_meal: 'Dish', th_status: 'Status', th_printed: 'Label',
      no_orders: 'No orders for this day', no_orders_sub: 'Orders appear here as soon as customers pick your dishes',
      nothing_sel: 'Select at least one order', nothing_unprinted: 'All labels are printed ✓',
      prev_h: 'Label preview', prev_bags_h: 'Bag label preview', print: 'Print', close: 'Close', labels_n: (n) => `${n} label${n === 1 ? '' : 's'}`,
      printed_ok: 'Orders marked as printed', printed_ok_sub: (n) => `${n} label${n === 1 ? '' : 's'}`,
      prep_h: 'Prep list', prep_meal: 'Dish', total: 'Total', kcal: 'kcal', print_prep: 'Print list',
      special: 'Special notes — customer allergies', special_none: 'No customer allergies recorded for this day', cust_alg: 'Customer allergy', meal_contains: 'Dish contains',
      prep_status: 'Progress', generated: 'Generated at',
      menu_h: 'My menu', active_of: (a, b) => `${a} of ${b} dishes active`, menu_note: 'Inactive dishes disappear from the customer app immediately and are never picked by the chef.',
      plans: 'Plans', allergens: 'Allergens', none: 'None', edit: 'Edit', active: 'Active', inactive: 'Inactive', reviews: 'reviews',
      edit_h: 'Edit dish', protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)', kcal_f: 'Energy (kcal)', shelf: 'Shelf life (days)',
      desc_ar: 'Description (Arabic)', desc_nl: 'Description (Dutch)', desc_en: 'Description (English)', save: 'Save changes', cancel: 'Cancel', saved: 'Dish saved', meal_on: 'Dish active', meal_off: 'Dish inactive — hidden from customers',
      st_today: 'Orders today', st_done_today: 'Picked up today', st_week: 'Meals delivered (7 days)', st_rating: 'Avg. rating', st_payout: 'Estimated payout', st_month: (m) => `This month · ${m}`,
      st_chart: 'Meals delivered — last 7 days', st_top: 'Most ordered (30 days)', st_low: 'Low ratings & comments', st_low_none: 'No low ratings — great work 👏',
      st_payout_calc: (n, p) => `${n} meals × ${p}`, per_meal: 'per meal', no_comment: 'No comment',
      notif: 'Notifications', mark_all: 'Mark all as read', notif_none: 'No notifications',
      sound_on: 'Sound on', sound_off: 'Sound off',
      d_order: 'Order details', d_customer: 'Customer', d_delivery: 'Delivery', d_meal: 'Dish', d_ingr: 'Ingredients', d_history: 'Status history', d_macros: 'Nutrition', d_print: 'Print label',
      city: 'City', date: 'Date',
      moved: 'Status updated', moved_n: (n) => `${n} order${n === 1 ? '' : 's'}`,
      new_orders: 'New orders',
      l_alg: 'Allergens', l_cust: '⚠ Customer allergy', l_prod: 'Produced', l_exp: 'Best before', l_cold: 'Keep refrigerated 0–4°C', l_none: 'None',
      bag: 'Delivery bag', bag_items: (n) => `${n} meal${n === 1 ? '' : 's'} in the bag`
    }
  };
  // strings used outside the dictionaries above
  Object.assign(T.ar, { desc_en: 'الوصف (إنجليزي)', new_tag: 'جديد', m_protein: 'بروتين', m_carbs: 'كارب', m_fat: 'دهون', title: 'لوحة المطعم',
    lbl_note: 'حدّد الطلبات ثم اطبع — كل استكر فيه رقم الطلب، اسم العميل، الوجبة بالعربي والهولندي، القيم الغذائية، مسببات الحساسية، تاريخ الإنتاج والصلاحية، وكود QR.' });
  Object.assign(T.nl, { desc_en: 'Omschrijving (Engels)', new_tag: 'Nieuw', m_protein: 'Eiwit', m_carbs: 'Koolh.', m_fat: 'Vet', title: 'Restaurantpaneel',
    lbl_note: 'Selecteer bestellingen en print — elk etiket bevat bestelnr., klant, gerecht (AR + NL), voedingswaarde, allergenen, productie- en houdbaarheidsdatum en een QR-code.' });
  Object.assign(T.en, { new_tag: 'New', m_protein: 'Protein', m_carbs: 'Carbs', m_fat: 'Fat', title: 'Restaurant panel',
    lbl_note: 'Select orders and print — each label shows the order no., customer, dish (EN + NL), nutrition, allergens, production and best-before dates, and a QR code.' });
  const LANGS = ['ar', 'nl', 'en'];
  const LANG_TAG = { ar: 'ع', nl: 'NL', en: 'EN' };
  function t(k, ...a) { const v = (T[lang] && T[lang][k] !== undefined) ? T[lang][k] : (T.ar[k] !== undefined ? T.ar[k] : k); return typeof v === 'function' ? v(...a) : v; }
  const LOCALE = () => ({ nl: 'nl-NL', en: 'en-GB' }[lang] || 'ar-u-nu-latn');
  /** Secondary language shown next to the primary one (menu cards, prep list, drawer). */
  const altLang = () => (lang === 'nl' ? 'ar' : 'nl');
  const langSeg = () => `<div class="seg lang-seg" role="group" aria-label="AR / NL / EN">${LANGS.map((l) => `<button class="${lang === l ? 'on' : ''}" data-act="lang" data-l="${l}" lang="${l}">${LANG_TAG[l]}</button>`).join('')}</div>`;

  // ---------------------------------------------------------------- icons (stroke, lucide-style)
  const IC = {
    board: '<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
    prep: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
    labels: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    menu: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
    stats: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-9"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    soundOn: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    soundOff: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    back: '<path d="m9 18 6-6-6-6"/>',
    euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.5 1.5 1.3 2.8 2.5 2.8z"/>'
  };
  const icon = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

  // ---------------------------------------------------------------- data helpers
  const R = () => DV.restaurant(rid) || {};
  const DONE = ['picked', 'on_way', 'delivered', 'failed'];
  const COLS = [
    // orders arrive already confirmed — restaurants don't accept/reject (partner agreement)
    { id: 'scheduled', st: ['scheduled', 'accepted'], next: 'preparing', btn: 'start_prep', bulk: 'prep_all' },
    { id: 'preparing', st: ['preparing'], next: 'ready', btn: 'mark_ready', bulk: 'ready_all' },
    { id: 'ready', st: ['ready'], next: null },
    { id: 'done', st: DONE, next: null }
  ];
  const WIN_ORDER = { early: 0, noon: 1, eve: 2 };

  function myOrders(date) {
    return DV.ordersFor({ date, restaurantId: rid }).filter((o) => o.status !== 'cancelled' && o.mealId);
  }
  function sortOrders(a, b) {
    return (WIN_ORDER[a.window] ?? 9) - (WIN_ORDER[b.window] ?? 9) || (a.slot === b.slot ? 0 : a.slot === 'lunch' ? -1 : 1) || String(a.no).localeCompare(String(b.no));
  }
  function applyFilters(list) {
    const q = ui.q.trim().toLowerCase();
    return list.filter((o) => {
      if (ui.slot !== 'all' && o.slot !== ui.slot) return false;
      if (!q) return true;
      const m = DV.meal(o.mealId) || {}, c = DV.customer(o.customerId) || {};
      return [o.no, c.name, DV.L(m.name, 'ar'), DV.L(m.name, 'nl'), DV.L(m.name, 'en')].some((s) => String(s || '').toLowerCase().includes(q));
    });
  }
  const winLabel = (id) => { const w = (DV.state.settings.deliveryWindows || []).find((x) => x.id === id); return w ? DV.L(w.label, lang) : (id || '—'); };
  const winTime = (id) => { const s = winLabel(id); const m = s.match(/\d{2}:\d{2}\s*[–-]\s*\d{2}:\d{2}/); return m ? m[0] : s; };
  const slotTxt = (s) => (DV.SLOTS[s] ? DV.SLOTS[s].icon + ' ' + DV.L(DV.SLOTS[s], lang) : s);
  const statusLabel = (s) => DV.L(DV.STATUS[s] || s, lang);
  const pill = (s) => { const c = (DV.STATUS[s] || {}).color || '#64748B'; return `<span class="status-pill" style="color:${c};background:${c}17">${esc(statusLabel(s))}</span>`; };
  const algName = (a) => DV.L(DV.ALLERGENS[a] || a, lang);
  const custAlg = (c) => (c && Array.isArray(c.allergies) ? c.allergies : []);
  const algChip = (a) => `<span class="chip chip-alg">⚠ ${esc(algName(a))}</span>`;
  function shortName(c) {
    const p = String((c && c.name) || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '—';
    return p[0] + (p.length > 1 ? ' ' + p[p.length - 1].charAt(0).toUpperCase() + '.' : '');
  }
  const shortDate = (iso) => DV.fmtDate(iso, 'nl', { day: '2-digit', month: '2-digit' });
  const longDate = (iso) => DV.fmtDate(iso, lang);
  const isFresh = (id) => (freshUntil.get(id) || 0) > Date.now();

  // new-order tracking (highlight cards that arrive from other tabs)
  let known = null;
  const freshUntil = new Map();
  let freshTimer = null;
  function trackNew() {
    if (!rid) { known = null; return; }
    const ids = DV.state.orders.filter((o) => o.restaurantId === rid && o.mealId && o.status !== 'cancelled').map((o) => o.id);
    if (known === null) { known = new Set(ids); return; }
    let added = 0;
    ids.forEach((id) => { if (!known.has(id)) { known.add(id); freshUntil.set(id, Date.now() + 20000); added++; } });
    if (added && HAS_DOM) { clearTimeout(freshTimer); freshTimer = setTimeout(render, 20500); }
  }

  // ---------------------------------------------------------------- QR
  function qrSVG(text) {
    const qf = W.qrcode;
    if (typeof qf !== 'function') return null;
    try {
      const q = qf(0, 'M'); q.addData(String(text)); q.make();
      const n = q.getModuleCount(); let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    } catch (e) { return null; }
  }
  const qrBox = (text, fallback) => { const s = qrSVG(text); return s ? `<div class="l-qr">${s}</div>` : `<div class="l-qr l-qr-fb num">${esc(fallback)}</div>`; };

  // ---------------------------------------------------------------- labels
  function labelHTML(o) {
    const m = DV.meal(o.mealId) || {}, c = DV.customer(o.customerId) || {};
    const algs = (m.allergens || []);
    const calg = custAlg(c);
    const exp = DV.addDays(o.date, m.shelfDays || 2);
    return `<div class="lbl">
      <div class="l-head">
        <img class="l-logo" src="../assets/img/logo.png" alt="Delyvo">
        <span class="l-slot">${esc(slotTxt(o.slot))}</span>
        <span class="l-no num">${esc(o.no)}</span>
      </div>
      <div class="l-body">
        ${qrBox(o.no, String(o.no).replace(/^DV/, ''))}
        <div class="l-info">
          <div class="l-cust">${esc(c.name || '—')}</div>
          <div class="l-date">${esc(DV.fmtDate(o.date, lang, { weekday: 'short', day: 'numeric', month: 'short' }))} · <span class="num">${esc(winTime(o.window))}</span></div>
          <div class="l-meal" dir="${lang === 'en' ? 'ltr' : 'rtl'}">${esc(DV.L(m.name, lang === 'en' ? 'en' : 'ar'))}</div>
          <div class="l-meal-nl" dir="ltr">${esc(DV.L(m.name, 'nl'))}</div>
          <div class="l-mac num" dir="ltr">${m.kcal || 0} kcal · P ${m.protein || 0}g · C ${m.carbs || 0}g · F ${m.fat || 0}g</div>
        </div>
      </div>
      <div class="l-alg">${esc(t('l_alg'))}: <b>${algs.length ? algs.map((a) => esc(algName(a))).join(', ') : esc(t('l_none'))}</b></div>
      ${calg.length ? `<div class="l-warn">${esc(t('l_cust'))}: ${calg.map((a) => esc(algName(a))).join(', ')}</div>` : ''}
      <div class="l-foot">
        <span>${esc(t('l_prod'))} <b class="num">${shortDate(o.date)}</b></span>
        <span>${esc(t('l_exp'))} <b class="num">${shortDate(exp)}</b></span>
      </div>
      <div class="l-reheat">${esc(DV.L(m.reheat, lang))} · ${esc(t('l_cold'))}</div>
    </div>`;
  }
  function bagHTML(c, orders) {
    const calg = custAlg(c);
    const o0 = orders[0];
    const nos = orders.map((o) => o.no).join(',');
    return `<div class="lbl lbl-bag">
      <div class="l-head">
        <img class="l-logo" src="../assets/img/logo.png" alt="Delyvo">
        <span class="l-slot">${icon('bag', 11)} ${esc(t('bag'))}</span>
        <span class="l-no num">${orders.length}×</span>
      </div>
      <div class="l-body">
        ${qrBox(nos, orders.length + '×')}
        <div class="l-info">
          <div class="l-cust l-cust-big">${esc(c.name || '—')}</div>
          <div class="l-date">${esc(o0.city || '')} · ${esc(DV.fmtDate(o0.date, lang, { weekday: 'short', day: 'numeric', month: 'short' }))}</div>
          <div class="l-date"><b class="num">${esc(winTime(o0.window))}</b></div>
          <div class="l-mac">${esc(t('bag_items', orders.length))}</div>
        </div>
      </div>
      <ul class="l-list">${orders.map((o) => { const m = DV.meal(o.mealId) || {}; return `<li><b class="num">${esc(o.no)}</b> ${DV.SLOTS[o.slot] ? DV.SLOTS[o.slot].icon : ''} ${esc(DV.L(m.name, lang))}</li>`; }).join('')}</ul>
      ${calg.length ? `<div class="l-warn">${esc(t('l_cust'))}: ${calg.map((a) => esc(algName(a))).join(', ')}</div>` : ''}
      <div class="l-reheat">${esc(t('l_cold'))}</div>
    </div>`;
  }
  /** Build the label document. mode 'labels' → meal labels (+ bag label per customer if withBags); 'bags' → only bag labels. */
  function labelsDoc(ids, mode, withBags) {
    const orders = ids.map((id) => DV.order(id)).filter((o) => o && o.mealId && o.restaurantId === rid).sort(sortOrders);
    const groups = new Map();
    orders.forEach((o) => { if (!groups.has(o.customerId)) groups.set(o.customerId, []); groups.get(o.customerId).push(o); });
    let html = '', count = 0;
    if (mode === 'bags') {
      groups.forEach((list, cid) => {
        // a bag holds all of that customer's meals of the day from this restaurant
        const day = myOrders(list[0].date).filter((o) => o.customerId === cid).sort(sortOrders);
        html += bagHTML(DV.customer(cid) || {}, day); count++;
      });
    } else if (withBags) {
      groups.forEach((list, cid) => {
        list.forEach((o) => { html += labelHTML(o); count++; });
        const day = myOrders(list[0].date).filter((o) => o.customerId === cid).sort(sortOrders);
        html += bagHTML(DV.customer(cid) || {}, day); count++;
      });
    } else {
      orders.forEach((o) => { html += labelHTML(o); count++; });
    }
    return { html, count, orders };
  }

  // ---------------------------------------------------------------- prep list
  function prepData(date) {
    const list = myOrders(date);
    const per = {};
    list.forEach((o) => {
      const p = per[o.mealId] || (per[o.mealId] = { m: DV.meal(o.mealId) || {}, lunch: 0, dinner: 0 });
      p[o.slot] = (p[o.slot] || 0) + 1;
    });
    const rows = Object.values(per).sort((a, b) => (b.lunch + b.dinner) - (a.lunch + a.dinner));
    const notes = list.filter((o) => custAlg(DV.customer(o.customerId)).length).sort(sortOrders).map((o) => {
      const c = DV.customer(o.customerId) || {}, m = DV.meal(o.mealId) || {};
      const ca = custAlg(c);
      return { o, c, m, ca, conflict: ca.filter((a) => (m.allergens || []).includes(a)) };
    });
    const byStatus = {};
    list.forEach((o) => { const k = DONE.includes(o.status) ? 'done' : o.status === 'accepted' ? 'scheduled' : o.status; byStatus[k] = (byStatus[k] || 0) + 1; });
    return { list, rows, notes, byStatus, lunch: list.filter((o) => o.slot === 'lunch').length, dinner: list.filter((o) => o.slot === 'dinner').length };
  }
  function prepSheet(date, forPrint) {
    const d = prepData(date);
    const r = R();
    const head = forPrint ? `<div class="pp-head">
        <img src="../assets/img/logo.png" alt="Delyvo" class="pp-logo">
        <div class="grow"><h2>${esc(t('prep_h'))} · ${esc(r.name || '')}</h2><div class="muted">${esc(longDate(date))}</div></div>
        <div class="muted small">${esc(t('generated'))} ${esc(DV.fmtTime(Date.now(), lang))}</div>
      </div>` : '';
    const table = d.rows.length ? `<table class="tbl prep-tbl">
      <thead><tr><th>${esc(t('prep_meal'))}</th><th class="c">${esc(t('kcal'))}</th><th class="c">☀️ ${esc(t('lunch'))}</th><th class="c">🌙 ${esc(t('dinner'))}</th><th class="c">${esc(t('total'))}</th></tr></thead>
      <tbody>${d.rows.map((x) => `<tr>
        <td><div class="row">${forPrint ? '' : `<img class="thumb" src="${esc(x.m.img)}" alt="">`}<div class="grow"><b>${esc(DV.L(x.m.name, lang))}</b><div class="tiny muted">${esc(DV.L(x.m.name, altLang()))}${(x.m.allergens || []).length ? ' · ' + x.m.allergens.map((a) => esc(algName(a))).join(', ') : ''}</div></div></div></td>
        <td class="c num">${x.m.kcal || 0}</td><td class="c num">${x.lunch || '–'}</td><td class="c num">${x.dinner || '–'}</td><td class="c num bold big">${x.lunch + x.dinner}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${esc(t('total'))}</td><td></td><td class="c num">${d.lunch}</td><td class="c num">${d.dinner}</td><td class="c num big">${d.list.length}</td></tr></tfoot>
    </table>` : emptyHTML();
    const notes = `<h3 class="sec-h">${icon('alert', 18)} ${esc(t('special'))}</h3>` + (d.notes.length ? `<table class="tbl notes-tbl">
      <thead><tr><th>${esc(t('th_no'))}</th><th>${esc(t('th_cust'))}</th><th>${esc(t('th_meal'))}</th><th>${esc(t('cust_alg'))}</th></tr></thead>
      <tbody>${d.notes.map((n) => `<tr class="${n.conflict.length ? 'is-conflict' : ''}">
        <td class="num bold">${esc(n.o.no)}<div class="tiny muted">${esc(slotTxt(n.o.slot))}</div></td>
        <td>${esc(shortName(n.c))}</td>
        <td>${esc(DV.L(n.m.name, lang))}</td>
        <td><span class="alg-txt">⚠ ${n.ca.map((a) => esc(algName(a))).join(', ')}</span>${n.conflict.length ? `<div class="conflict-txt">${esc(t('meal_contains'))}: ${n.conflict.map((a) => esc(algName(a))).join(', ')} — ${esc(t('conflict'))}</div>` : ''}</td>
      </tr>`).join('')}</tbody></table>` : `<p class="muted small pad0">${esc(t('special_none'))}</p>`);
    return head + table + notes;
  }

  // ---------------------------------------------------------------- views
  function emptyHTML(title, sub) {
    return `<div class="empty-state"><div class="es-ic">🍽️</div><b>${esc(title || t('no_orders'))}</b><p class="muted small">${esc(sub || t('no_orders_sub'))}</p></div>`;
  }

  function loginHTML() {
    const rs = DV.state.restaurants;
    const dots = [0, 1, 2, 3].map((i) => `<i class="${i < ui.pin.length ? 'on' : ''}"></i>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    return `<div class="login">
      <div class="login-card fade-up">
        <div class="login-top">
          <img src="../assets/img/logo.png" alt="Delyvo" class="login-logo">
          ${langSeg()}
        </div>
        <span class="eyebrow">${esc(t('partner'))}</span>
        <h1>${esc(t('login_h'))}</h1>
        <p class="muted">${esc(t('login_sub'))}</p>
        <div class="login-grid">
          <div>
            <div class="lbl-h">${esc(t('pick_r'))}</div>
            <div class="r-list">${rs.map((r) => `<button class="r-card${ui.loginR === r.id ? ' on' : ''}" data-act="pick-r" data-id="${esc(r.id)}">
              <span class="r-av" style="background:${esc(r.color || '#1FA06B')}">${esc((r.name || '?').charAt(0))}</span>
              <span class="grow"><b>${esc(r.name)}</b><small>${esc(DV.L(r.cuisine, lang) || '')} · ${esc(r.city || '')}</small></span>
              <span class="r-check">${icon('check', 16)}</span>
            </button>`).join('')}</div>
          </div>
          <div class="pin-box${ui.pinErr ? ' err' : ''}">
            <div class="lbl-h">${esc(t('pin'))}</div>
            <div class="pin-dots">${dots}</div>
            <div class="pin-msg">${ui.pinErr ? esc(t('wrong_pin')) : `<span class="chip chip-brand">${esc(t('pin_hint'))}</span>`}</div>
            <div class="keypad">${keys.map((k) => k === 'del' ? `<button data-act="key" data-k="del" aria-label="del">⌫</button>` : k === 'ok' ? `<button class="k-ok" data-act="login">${icon('check', 22)}</button>` : `<button data-act="key" data-k="${k}" class="num">${k}</button>`).join('')}</div>
            <button class="btn btn-primary btn-block" data-act="login">${esc(t('enter'))}</button>
          </div>
        </div>
        <p class="tiny muted login-foot">${esc(t('login_foot'))}</p>
      </div>
    </div>`;
  }

  function shellHTML() {
    return `<div class="shell">
      <aside class="side" id="side"></aside>
      <main class="main">
        <header class="top" id="top"></header>
        <div class="view" id="view"></div>
      </main>
    </div>`;
  }

  function sideHTML() {
    const r = R();
    const counts = { board: myOrders(DV.today()).filter((o) => ['scheduled'].includes(o.status)).length, labels: myOrders(ui.date).filter((o) => !o.printed).length };
    return `<div class="side-brand"><img src="../assets/img/logo.png" alt="Delyvo"><span class="side-tag">${esc(t('partner'))}</span></div>
      <nav class="nav">${VIEWS.map((v) => `<button class="nav-i${ui.view === v ? ' on' : ''}" data-act="nav" data-v="${v}">
        ${icon(v, 21)}<span class="nav-t">${esc(t('nav_' + v))}</span>${counts[v] ? `<span class="nav-n num">${counts[v]}</span>` : ''}
      </button>`).join('')}</nav>
      <div class="side-foot">
        <div class="me">
          <span class="r-av" style="background:${esc(r.color || '#1FA06B')}">${esc((r.name || '?').charAt(0))}</span>
          <div class="grow"><b class="ellipsis">${esc(r.name || '')}</b><small class="ellipsis">${esc(DV.L(r.cuisine, lang) || '')} · ${esc(r.city || '')}</small></div>
        </div>
        <button class="btn btn-ghost btn-sm btn-block" data-act="logout">${icon('logout', 16)} ${esc(t('logout'))}</button>
      </div>`;
  }

  function topHTML() {
    const r = R();
    const T0 = DV.today();
    const quick = [[T0, 'today'], [DV.addDays(T0, 1), 'tomorrow'], [DV.addDays(T0, 2), 'after']];
    const showDate = ['board', 'prep', 'labels'].includes(ui.view);
    const notes = DV.notificationsFor('restaurant:' + rid);
    const unread = notes.filter((n) => !n.read).length;
    return `<div class="top-l">
        <div class="top-title"><h1>${esc(t('nav_' + ui.view))}</h1><span class="muted small">${esc(r.name || '')} · ${esc(t('sub_' + ui.view))}</span></div>
      </div>
      ${showDate ? `<div class="datebar">
        <div class="seg">${quick.map(([d, k]) => `<button class="${ui.date === d ? 'on' : ''}" data-act="date" data-d="${d}">${esc(t(k))}</button>`).join('')}</div>
        <label class="date-in">${icon('cal', 17)}<input type="date" value="${esc(ui.date)}" data-chg="date" aria-label="${esc(t('date'))}"></label>
        <span class="date-long">${esc(longDate(ui.date))}</span>
      </div>` : '<div class="grow"></div>'}
      <div class="top-r">
        <span class="clock num" id="clock"></span>
        <button class="icon-btn${soundOn ? ' on' : ''}" data-act="sound" title="${esc(soundOn ? t('sound_on') : t('sound_off'))}">${icon(soundOn ? 'soundOn' : 'soundOff', 19)}</button>
        ${langSeg()}
        <div class="bell-wrap">
          <button class="icon-btn${unread ? ' ring' : ''}" data-act="bell" aria-label="${esc(t('notif'))}">${icon('bell', 19)}${unread ? `<span class="badge-dot">${unread > 99 ? '99+' : unread}</span>` : ''}</button>
          ${ui.notifOpen ? notifHTML(notes) : ''}
        </div>
      </div>`;
  }

  function notifHTML(notes) {
    return `<div class="pop" data-stop>
      <div class="pop-h"><b>${esc(t('notif'))}</b><button class="btn btn-xs btn-ghost" data-act="read-all">${esc(t('mark_all'))}</button></div>
      <div class="pop-b">${notes.length ? notes.slice(0, 40).map((n) => `<button class="nt${n.read ? '' : ' unread'}" data-act="read-one" data-id="${esc(n.id)}">
        <span class="nt-ic">${esc(n.icon || '🔔')}</span>
        <span class="grow"><b>${esc(DV.L(n.title, lang))}</b>${n.body ? `<small>${esc(DV.L(n.body, lang))}</small>` : ''}<em class="num">${esc(DV.fmtTime(n.at, lang))} · ${esc(DV.fmtDate(DV.toISO(new Date(n.at)), lang, { day: 'numeric', month: 'short' }))}</em></span>
      </button>`).join('') : `<div class="empty small">${esc(t('notif_none'))}</div>`}</div>
    </div>`;
  }

  // ---- board
  function boardHTML() {
    const all = myOrders(ui.date);
    const list = applyFilters(all);
    const algN = all.filter((o) => custAlg(DV.customer(o.customerId)).length).length;
    const unprinted = all.filter((o) => !o.printed).length;
    const doneN = all.filter((o) => o.status === 'ready' || DONE.includes(o.status)).length;
    const kpis = [
      ['k_total', all.length, ''], ['k_lunch', all.filter((o) => o.slot === 'lunch').length, '☀️'], ['k_dinner', all.filter((o) => o.slot === 'dinner').length, '🌙'],
      ['k_ready', doneN + '/' + all.length, ''], ['k_alg', algN, '', algN ? 'kpi-red' : ''], ['k_unprinted', unprinted, '', unprinted ? 'kpi-amber' : '']
    ];
    const cnt = (s) => all.filter((o) => s === 'all' || o.slot === s).length;
    return `<div class="kpis">${kpis.map(([k, v, ic, cls]) => `<div class="kpi ${cls || ''}"><small>${ic ? ic + ' ' : ''}${esc(t(k))}</small><b class="num">${v}</b></div>`).join('')}</div>
      <div class="toolbar">
        <div class="seg">${['all', 'lunch', 'dinner'].map((s) => `<button class="${ui.slot === s ? 'on' : ''}" data-act="slot" data-s="${s}">${s === 'all' ? '' : DV.SLOTS[s].icon + ' '}${esc(t(s))} <span class="seg-n num">${cnt(s)}</span></button>`).join('')}</div>
        <label class="search">${icon('search', 18)}<input type="search" placeholder="${esc(t('search'))}" value="${esc(ui.q)}" data-keep="q" data-inp="q"></label>
        <div class="grow"></div>
        <button class="btn btn-outline btn-sm" data-act="print-unprinted" ${unprinted ? '' : 'disabled'}>${icon('printer', 17)} ${esc(t('print_unprinted'))}${unprinted ? ` <span class="pill-n num">${unprinted}</span>` : ''}</button>
      </div>
      ${all.length ? `<div class="board">${COLS.map((col) => colHTML(col, list)).join('')}</div>` : emptyHTML()}`;
  }
  function colHTML(col, list) {
    const items = list.filter((o) => col.st.includes(o.status)).sort(sortOrders);
    const color = (DV.STATUS[col.id === 'done' ? 'delivered' : col.id] || {}).color;
    return `<section class="col" style="--c:${color}">
      <header class="col-h">
        <span class="col-dot"></span><b>${esc(t('col_' + col.id))}</b><span class="col-n num">${items.length}</span>
        <span class="grow"></span>
        ${col.bulk ? `<button class="btn btn-xs col-bulk" data-act="bulk" data-col="${col.id}" ${items.length ? '' : 'disabled'}>${esc(t(col.bulk))}</button>` : ''}
      </header>
      <div class="col-b">${items.length ? items.map((o) => cardHTML(o, col)).join('') : `<div class="col-empty">${esc(t('empty_col'))}</div>`}</div>
    </section>`;
  }
  function cardHTML(o, col) {
    const m = DV.meal(o.mealId) || {}, c = DV.customer(o.customerId);
    const ca = custAlg(c);
    const conflict = ca.some((a) => (m.allergens || []).includes(a));
    let foot = '';
    if (col.next) foot = `<button class="btn oc-btn" data-act="adv" data-id="${esc(o.id)}" data-to="${col.next}" style="--bc:${DV.STATUS[col.next].color}">${esc(t(col.btn))}</button>`;
    else if (col.id === 'ready') { const d = o.driverId && DV.driver(o.driverId); foot = `<div class="oc-wait">${icon('truck', 16)} ${d ? esc(t('waiting_driver')) + ' · <b>' + esc(d.name) + '</b>' : esc(t('no_driver'))}</div>`; }
    else foot = pill(o.status);
    return `<article class="ocard${isFresh(o.id) ? ' is-new' : ''}${ca.length ? ' has-alg' : ''}" data-act="open" data-id="${esc(o.id)}" tabindex="0">
      <div class="oc-top">
        <span class="oc-no num">${esc(o.no)}</span>
        <span class="oc-slot s-${esc(o.slot)}">${esc(slotTxt(o.slot))}</span>
        <span class="grow"></span>
        ${isFresh(o.id) ? `<span class="new-tag">${esc(t('new_tag'))}</span>` : ''}
        ${o.printed ? `<span class="oc-printed" title="${esc(t('printed'))}">${icon('printer', 14)}${icon('check', 13)}</span>` : ''}
      </div>
      <div class="oc-meal"><img src="${esc(m.img || '')}" alt="" loading="lazy"><div class="grow"><b class="oc-mname">${esc(DV.L(m.name, lang))}</b><small class="muted num">${m.kcal || 0} kcal · P${m.protein || 0}</small></div></div>
      <div class="oc-meta"><span>${icon('user', 15)} ${esc(shortName(c))}</span><span>${icon('clock', 15)} <span class="num">${esc(winTime(o.window))}</span></span></div>
      ${(o.auto || ca.length) ? `<div class="oc-tags">${o.auto ? `<span class="chip chip-chef">👨‍🍳 ${esc(t('chef'))}</span>` : ''}${ca.map(algChip).join('')}${conflict ? `<span class="chip chip-conflict">${icon('alert', 13)} ${esc(t('conflict'))}</span>` : ''}</div>` : ''}
      <div class="oc-foot">${foot}</div>
    </article>`;
  }

  // ---- prep
  function prepHTML() {
    const d = prepData(ui.date);
    const steps = ['scheduled', 'preparing', 'ready', 'done'];
    return `<div class="toolbar">
        <div class="prog">${steps.map((s) => { const c = (DV.STATUS[s === 'done' ? 'delivered' : s] || {}).color; return `<span class="prog-i" style="--c:${c}"><i></i>${esc(t('col_' + s))} <b class="num">${d.byStatus[s] || 0}</b></span>`; }).join('')}</div>
        <div class="grow"></div>
        <button class="btn btn-primary btn-sm" data-act="print-prep" ${d.list.length ? '' : 'disabled'}>${icon('printer', 17)} ${esc(t('print_prep'))}</button>
      </div>
      <div class="card sheet">${prepSheet(ui.date, false)}</div>`;
  }

  // ---- labels
  function labelsHTML() {
    const all = myOrders(ui.date);
    let list = applyFilters(all).sort(sortOrders);
    if (ui.lblFilter === 'unprinted') list = list.filter((o) => !o.printed);
    if (ui.lblFilter === 'printed') list = list.filter((o) => o.printed);
    const visible = new Set(all.map((o) => o.id));
    [...ui.sel].forEach((id) => { if (!visible.has(id)) ui.sel.delete(id); });
    const allSel = list.length && list.every((o) => ui.sel.has(o.id));
    const unprinted = all.filter((o) => !o.printed).length;
    return `<div class="lbl-hero card">
        <div class="lh-ic">${icon('labels', 26)}</div>
        <div class="grow">
          <b>${esc(t('print_selected'))}</b>
          <p class="muted small">${esc(t('lbl_note'))}</p>
        </div>
        <div class="lh-actions">
          <label class="field-inline"><span>${esc(t('size'))}</span>
            <select class="select sel-sm" data-chg="size">${Object.keys(SIZES).map((k) => `<option value="${k}" ${ui.size === k ? 'selected' : ''}>${k.replace('x', ' × ')} mm</option>`).join('')}</select></label>
          <label class="check-inline"><span class="switch"><input type="checkbox" data-chg="bags" ${ui.bags ? 'checked' : ''}><i></i></span>${esc(t('with_bags'))}</label>
        </div>
      </div>
      <div class="toolbar">
        <div class="seg">${['all', 'lunch', 'dinner'].map((s) => `<button class="${ui.slot === s ? 'on' : ''}" data-act="slot" data-s="${s}">${s === 'all' ? '' : DV.SLOTS[s].icon + ' '}${esc(t(s))}</button>`).join('')}</div>
        <div class="seg">${['all', 'unprinted', 'printed'].map((s) => `<button class="${ui.lblFilter === s ? 'on' : ''}" data-act="lfilter" data-f="${s}">${esc(t('f_' + s))}</button>`).join('')}</div>
        <label class="search">${icon('search', 18)}<input type="search" placeholder="${esc(t('search'))}" value="${esc(ui.q)}" data-keep="q" data-inp="q"></label>
      </div>
      <div class="actionbar${ui.sel.size ? ' has-sel' : ''}">
        <span class="sel-n">${esc(t('selected', ui.sel.size))}</span>
        <div class="grow"></div>
        <button class="btn btn-ghost btn-sm" data-act="preview-bags">${icon('bag', 17)} ${esc(t('bag_labels'))}</button>
        <button class="btn btn-outline btn-sm" data-act="print-unprinted" ${unprinted ? '' : 'disabled'}>${icon('printer', 17)} ${esc(t('print_unprinted'))}${unprinted ? ` <span class="pill-n num">${unprinted}</span>` : ''}</button>
        <button class="btn btn-primary btn-sm" data-act="preview-sel" ${ui.sel.size ? '' : 'disabled'}>${icon('labels', 17)} ${esc(t('print_selected'))}</button>
      </div>
      ${list.length ? `<div class="card tbl-wrap"><table class="tbl sel-tbl">
        <thead><tr>
          <th class="cb"><label class="cbx"><input type="checkbox" data-chg="sel-all" ${allSel ? 'checked' : ''}><i></i></label></th>
          <th>${esc(t('th_no'))}</th><th>${esc(t('th_slot'))}</th><th class="hide-sm">${esc(t('th_window'))}</th><th>${esc(t('th_cust'))}</th><th>${esc(t('th_meal'))}</th><th class="hide-sm">${esc(t('th_status'))}</th><th class="c">${esc(t('th_printed'))}</th><th></th>
        </tr></thead>
        <tbody>${list.map((o) => { const m = DV.meal(o.mealId) || {}, c = DV.customer(o.customerId); const ca = custAlg(c); return `<tr class="${ui.sel.has(o.id) ? 'on' : ''}${isFresh(o.id) ? ' is-new' : ''}">
          <td class="cb"><label class="cbx"><input type="checkbox" data-chg="sel" data-id="${esc(o.id)}" ${ui.sel.has(o.id) ? 'checked' : ''}><i></i></label></td>
          <td class="num bold">${esc(o.no)}</td>
          <td>${esc(slotTxt(o.slot))}</td>
          <td class="hide-sm num small">${esc(winTime(o.window))}</td>
          <td>${esc(shortName(c))}${ca.length ? `<div class="tiny alg-txt">⚠ ${ca.map((a) => esc(algName(a))).join(', ')}</div>` : ''}</td>
          <td><div class="row"><img class="thumb" src="${esc(m.img || '')}" alt="" loading="lazy"><span class="ellipsis">${esc(DV.L(m.name, lang))}</span></div></td>
          <td class="hide-sm">${pill(o.status)}</td>
          <td class="c">${o.printed ? `<span class="ok-dot">${icon('check', 14)}</span>` : '<span class="muted">—</span>'}</td>
          <td><button class="btn btn-ghost btn-xs" data-act="print-one" data-id="${esc(o.id)}">${icon('printer', 15)}</button></td>
        </tr>`; }).join('')}</tbody></table></div>` : emptyHTML()}`;
  }

  // ---- menu
  function menuHTML() {
    const meals = DV.state.meals.filter((m) => m.restaurantId === rid);
    const act = meals.filter((m) => m.active).length;
    return `<div class="toolbar"><div class="menu-sum"><b>${esc(t('active_of', act, meals.length))}</b><span class="muted small">${esc(t('menu_note'))}</span></div></div>
      <div class="meal-grid">${meals.map((m) => `<article class="mcard card${m.active ? '' : ' off'}">
        <div class="mc-img"><img src="${esc(m.img)}" alt="" loading="lazy">
          <span class="mc-state">${esc(m.active ? t('active') : t('inactive'))}</span>
          <span class="mc-rate">${icon('star', 13)} <b class="num">${(+m.rating || 0).toFixed(1)}</b> <small class="num">(${m.ratingCount || 0})</small></span>
        </div>
        <div class="mc-b">
          <div class="row between"><div class="grow"><h3>${esc(DV.L(m.name, lang))}</h3><small class="muted">${esc(DV.L(m.name, altLang()))}</small></div>
            <label class="switch" title="${esc(m.active ? t('active') : t('inactive'))}"><input type="checkbox" data-chg="meal-active" data-id="${esc(m.id)}" ${m.active ? 'checked' : ''}><i></i></label></div>
          <p class="mc-desc small muted">${esc(DV.L(m.desc, lang))}</p>
          <div class="macros">
            <div><b class="num">${m.kcal}</b><small>kcal</small></div><div><b class="num">${m.protein}g</b><small>${esc(t('m_protein'))}</small></div>
            <div><b class="num">${m.carbs}g</b><small>${esc(t('m_carbs'))}</small></div><div><b class="num">${m.fat}g</b><small>${esc(t('m_fat'))}</small></div>
          </div>
          <div class="mc-row"><span class="tiny muted">${esc(t('plans'))}</span>${(m.plans || []).map((p) => { const pt = DV.planType(p); return `<span class="chip chip-brand">${esc(pt ? pt.icon + ' ' + DV.L(pt.name, lang) : p)}</span>`; }).join('')}
            ${(m.slots || []).map((s) => `<span class="chip">${esc(slotTxt(s))}</span>`).join('')}</div>
          <div class="mc-row"><span class="tiny muted">${esc(t('allergens'))}</span>${(m.allergens || []).length ? m.allergens.map((a) => `<span class="chip chip-warn">${esc((DV.ALLERGENS[a] || {}).icon || '')} ${esc(algName(a))}</span>`).join('') : `<span class="chip">${esc(t('none'))}</span>`}</div>
          <button class="btn btn-outline btn-sm btn-block" data-act="edit-meal" data-id="${esc(m.id)}">${icon('edit', 16)} ${esc(t('edit'))}</button>
        </div>
      </article>`).join('')}</div>`;
  }
  function editMealHTML(m) {
    const num = (k, lbl, step) => `<label class="field"><span>${esc(lbl)}</span><input class="input num" type="number" min="0" step="${step || 1}" name="${k}" value="${esc(m[k] ?? '')}" required></label>`;
    return `<form class="modal-card fade-up" data-form="meal" data-id="${esc(m.id)}">
      <div class="modal-h"><div class="row"><img class="thumb lg" src="${esc(m.img)}" alt=""><div><b>${esc(t('edit_h'))}</b><div class="muted small">${esc(DV.L(m.name, lang))}</div></div></div>
        <button type="button" class="icon-btn" data-act="close-modal">${icon('x', 18)}</button></div>
      <div class="modal-b">
        <div class="grid-4">${num('kcal', t('kcal_f'))}${num('protein', t('protein'))}${num('carbs', t('carbs'))}${num('fat', t('fat'))}</div>
        <div class="grid-4">${num('shelfDays', t('shelf'))}</div>
        <div class="field"><span>${esc(t('allergens'))}</span>
          <div class="alg-pick">${Object.keys(DV.ALLERGENS).map((a) => `<label class="ap"><input type="checkbox" name="alg" value="${a}" ${(m.allergens || []).includes(a) ? 'checked' : ''}><span>${esc(DV.ALLERGENS[a].icon)} ${esc(algName(a))}</span></label>`).join('')}</div>
        </div>
        <label class="field"><span>${esc(t('desc_ar'))}</span><textarea class="textarea" name="desc_ar" dir="rtl">${esc(DV.L(m.desc, 'ar'))}</textarea></label>
        <label class="field"><span>${esc(t('desc_nl'))}</span><textarea class="textarea" name="desc_nl" dir="ltr">${esc(DV.L(m.desc, 'nl'))}</textarea></label>
        <label class="field"><span>${esc(t('desc_en'))}</span><textarea class="textarea" name="desc_en" dir="ltr">${esc(m.desc && typeof m.desc === 'object' ? (m.desc.en || '') : '')}</textarea></label>
      </div>
      <div class="modal-f"><button type="button" class="btn btn-ghost" data-act="close-modal">${esc(t('cancel'))}</button><button type="submit" class="btn btn-primary">${icon('check', 18)} ${esc(t('save'))}</button></div>
    </form>`;
  }

  // ---- stats
  function statsData() {
    const T0 = DV.today();
    const mine = DV.state.orders.filter((o) => o.restaurantId === rid && o.mealId && o.status !== 'cancelled');
    const delivered = mine.filter((o) => o.status === 'delivered');
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = DV.addDays(T0, -i); days.push({ d, n: delivered.filter((o) => o.date === d).length }); }
    const today = mine.filter((o) => o.date === T0);
    const month = T0.slice(0, 7);
    const monthDelivered = delivered.filter((o) => o.date.slice(0, 7) === month).length;
    const r = R();
    const meals = DV.state.meals.filter((m) => m.restaurantId === rid);
    const rc = meals.reduce((s, m) => s + (m.ratingCount || 0), 0);
    const avg = rc ? meals.reduce((s, m) => s + (m.rating || 0) * (m.ratingCount || 0), 0) / rc : 0;
    const low = mine.filter((o) => o.rating != null && (o.rating <= 3 || (o.comment && o.rating <= 3))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
    const since = DV.addDays(T0, -30);
    const top = {};
    mine.filter((o) => o.date >= since && o.date <= T0).forEach((o) => { top[o.mealId] = (top[o.mealId] || 0) + 1; });
    const topList = Object.entries(top).map(([id, n]) => ({ m: DV.meal(id) || {}, n })).sort((a, b) => b.n - a.n).slice(0, 5);
    return { days, today, todayDone: today.filter((o) => DONE.includes(o.status)).length, week: days.reduce((s, x) => s + x.n, 0),
      avg, rc, low, topList, monthDelivered, payout: monthDelivered * (r.costPerMeal || 0), cost: r.costPerMeal || 0, month };
  }
  function statsHTML() {
    const s = statsData();
    const max = Math.max(1, ...s.days.map((x) => x.n));
    const monthName = DV.fmtDate(s.month + '-01', lang, { month: 'long', year: 'numeric' });
    const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
    const topMax = Math.max(1, ...s.topList.map((x) => x.n));
    return `<div class="stat-grid">
        <div class="stat card"><span class="st-ic">${icon('board', 20)}</span><small>${esc(t('st_today'))}</small><b class="num">${s.today.length}</b><span class="muted tiny">${esc(t('st_done_today'))}: <b class="num">${s.todayDone}</b></span></div>
        <div class="stat card"><span class="st-ic">${icon('truck', 20)}</span><small>${esc(t('st_week'))}</small><b class="num">${s.week}</b><span class="muted tiny">${esc(DV.fmtDate(s.days[0].d, lang, { day: 'numeric', month: 'short' }))} – ${esc(DV.fmtDate(s.days[6].d, lang, { day: 'numeric', month: 'short' }))}</span></div>
        <div class="stat card"><span class="st-ic amber">${icon('star', 20)}</span><small>${esc(t('st_rating'))}</small><b class="num">${s.avg.toFixed(2)}<span class="of">/5</span></b><span class="muted tiny num">${s.rc} ${esc(t('reviews'))}</span></div>
        <div class="stat card stat-hero"><span class="st-ic">${icon('euro', 20)}</span><small>${esc(t('st_payout'))}</small><b class="num">${esc(DV.money(s.payout, lang))}</b><span class="tiny">${esc(t('st_month', monthName))} · ${esc(t('st_payout_calc', s.monthDelivered, DV.money(s.cost, lang)))}</span></div>
      </div>
      <div class="stat-2">
        <div class="card pad-l">
          <h3 class="sec-h">${esc(t('st_chart'))}</h3>
          <div class="bars">${s.days.map((x) => `<div class="bar"><span class="bar-v num">${x.n}</span><div class="bar-f" style="height:${Math.round((x.n / max) * 100)}%"></div><span class="bar-l">${esc(DV.fmtDate(x.d, lang, { weekday: 'short' }))}<small class="num">${esc(shortDate(x.d))}</small></span></div>`).join('')}</div>
        </div>
        <div class="card pad-l">
          <h3 class="sec-h">${esc(t('st_top'))}</h3>
          ${s.topList.length ? `<div class="top-list">${s.topList.map((x) => `<div class="tl"><img class="thumb" src="${esc(x.m.img || '')}" alt=""><div class="grow"><div class="row between"><b class="small ellipsis">${esc(DV.L(x.m.name, lang))}</b><span class="num small bold">${x.n}</span></div><div class="tl-bar"><i style="width:${Math.round((x.n / topMax) * 100)}%"></i></div></div></div>`).join('')}</div>` : `<p class="muted small">—</p>`}
        </div>
      </div>
      <div class="card pad-l">
        <h3 class="sec-h">${icon('alert', 18)} ${esc(t('st_low'))}</h3>
        ${s.low.length ? `<div class="low-list">${s.low.map((o) => { const m = DV.meal(o.mealId) || {}; return `<div class="low">
          <span class="stars r${o.rating}">${stars(o.rating)}</span>
          <div class="grow"><b class="small">${esc(DV.L(m.name, lang))}</b><div class="small ${o.comment ? '' : 'muted'}">${esc(o.comment || t('no_comment'))}</div></div>
          <span class="tiny muted num">${esc(o.no)} · ${esc(DV.fmtDate(o.date, lang, { day: 'numeric', month: 'short' }))}</span>
        </div>`; }).join('')}</div>` : `<p class="muted small">${esc(t('st_low_none'))}</p>`}
      </div>`;
  }

  // ---- drawer
  function drawerBody(o) {
    const m = DV.meal(o.mealId) || {}, c = DV.customer(o.customerId) || {};
    const ca = custAlg(c);
    const conflict = ca.filter((a) => (m.allergens || []).includes(a));
    const col = COLS.find((x) => x.st.includes(o.status));
    const d = o.driverId && DV.driver(o.driverId);
    return `<div class="dr-h">
        <div><small class="muted">${esc(t('d_order'))}</small><h2 class="num">${esc(o.no)}</h2></div>
        <div class="row">${pill(o.status)}<button class="icon-btn" data-act="close-drawer">${icon('x', 18)}</button></div>
      </div>
      <div class="dr-b">
        <div class="dr-hero"><img src="${esc(m.img || '')}" alt=""><div class="dr-hero-t"><b>${esc(DV.L(m.name, lang))}</b><small>${esc(DV.L(m.name, altLang()))}</small></div></div>
        ${o.auto ? `<div class="chip chip-chef">👨‍🍳 ${esc(t('chef'))}</div>` : ''}
        ${ca.length ? `<div class="alert-box${conflict.length ? ' hard' : ''}">${icon('alert', 20)}<div><b>${esc(t('cust_alg'))}: ${ca.map((a) => esc(algName(a))).join(', ')}</b>${conflict.length ? `<div>${esc(t('meal_contains'))}: ${conflict.map((a) => esc(algName(a))).join(', ')} — ${esc(t('conflict'))}</div>` : ''}</div></div>` : ''}
        <div class="kv">
          <div><small>${esc(t('d_customer'))}</small><b>${esc(shortName(c))}</b></div>
          <div><small>${esc(t('city'))}</small><b>${esc(o.city || '—')}</b></div>
          <div><small>${esc(t('date'))}</small><b>${esc(longDate(o.date))}</b></div>
          <div><small>${esc(t('th_slot'))}</small><b>${esc(slotTxt(o.slot))}</b></div>
          <div><small>${esc(t('th_window'))}</small><b>${esc(winLabel(o.window))}</b></div>
          <div><small>${esc(t('driver'))}</small><b>${d ? esc(d.name) : '—'}</b></div>
        </div>
        <h4 class="dr-sec">${esc(t('d_macros'))}</h4>
        <div class="macros"><div><b class="num">${m.kcal || 0}</b><small>kcal</small></div><div><b class="num">${m.protein || 0}g</b><small>P</small></div><div><b class="num">${m.carbs || 0}g</b><small>C</small></div><div><b class="num">${m.fat || 0}g</b><small>F</small></div></div>
        <h4 class="dr-sec">${esc(t('allergens'))}</h4>
        <div class="row wrap">${(m.allergens || []).length ? m.allergens.map((a) => `<span class="chip chip-warn">${esc((DV.ALLERGENS[a] || {}).icon || '')} ${esc(algName(a))}</span>`).join('') : `<span class="chip">${esc(t('none'))}</span>`}</div>
        <h4 class="dr-sec">${esc(t('d_ingr'))}</h4>
        <p class="small">${esc(DV.L(m.ingredients, lang))}</p>
        <h4 class="dr-sec">${esc(t('d_history'))}</h4>
        <ol class="tl-v">${(o.history || []).map((h) => { const cl = (DV.STATUS[h.s] || {}).color || '#94A3B8'; return `<li style="--c:${cl}"><i></i><div><b>${esc(statusLabel(h.s))}</b><small class="muted num">${esc(DV.fmtDate(DV.toISO(new Date(h.at)), lang, { day: 'numeric', month: 'short' }))} · ${esc(DV.fmtTime(h.at, lang))}${h.by ? ' · ' + esc(h.by) : ''}${h.note ? ' · ' + esc(h.note) : ''}</small></div></li>`; }).join('')}</ol>
      </div>
      <div class="dr-f">
        <button class="btn btn-outline" data-act="print-one" data-id="${esc(o.id)}">${icon('printer', 18)} ${esc(t('d_print'))}${o.printed ? ' ✓' : ''}</button>
        ${col && col.next ? `<button class="btn btn-primary grow" data-act="adv" data-id="${esc(o.id)}" data-to="${col.next}">${esc(t(col.btn))}</button>` : ''}
      </div>`;
  }

  // ---- preview modal
  function previewHTML() {
    const p = ui.pending; if (!p) return '';
    const doc = labelsDoc(p.ids, p.mode, ui.bags);
    return `<div class="modal-card modal-wide fade-up">
      <div class="modal-h"><div><b>${esc(p.mode === 'bags' ? t('prev_bags_h') : t('prev_h'))}</b><div class="muted small">${esc(t('labels_n', doc.count))} · ${ui.size.replace('x', ' × ')} mm</div></div>
        <button class="icon-btn" data-act="close-modal">${icon('x', 18)}</button></div>
      <div class="prev-tools">
        <label class="field-inline"><span>${esc(t('size'))}</span><select class="select sel-sm" data-chg="size">${Object.keys(SIZES).map((k) => `<option value="${k}" ${ui.size === k ? 'selected' : ''}>${k.replace('x', ' × ')} mm</option>`).join('')}</select></label>
        ${p.mode === 'labels' ? `<label class="check-inline"><span class="switch"><input type="checkbox" data-chg="bags" ${ui.bags ? 'checked' : ''}><i></i></span>${esc(t('with_bags'))}</label>` : ''}
        ${typeof W.qrcode === 'function' ? '' : `<span class="chip chip-warn">QR offline → #</span>`}
      </div>
      <div class="prev-area"><div class="lbl-sheet sz-${ui.size} is-preview">${doc.html}</div></div>
      <div class="modal-f"><button class="btn btn-ghost" data-act="close-modal">${esc(t('close'))}</button><button class="btn btn-primary" data-act="do-print" ${doc.count ? '' : 'disabled'}>${icon('printer', 18)} ${esc(t('print'))} · <span class="num">${doc.count}</span></button></div>
    </div>`;
  }

  // ---------------------------------------------------------------- render
  function viewHTML() {
    switch (ui.view) {
      case 'prep': return prepHTML();
      case 'labels': return labelsHTML();
      case 'menu': return menuHTML();
      case 'stats': return statsHTML();
      default: return boardHTML();
    }
  }
  function applyLang() {
    if (!HAS_DOM) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
  function updateTitle() {
    const unread = rid ? DV.notificationsFor('restaurant:' + rid).filter((n) => !n.read).length : 0;
    document.title = (unread ? `(${unread}) ` : '') + 'Delyvo · ' + t('title');
  }
  function render() {
    if (!HAS_DOM) return;
    const app = document.getElementById('app');
    if (!rid) {
      document.body.classList.add('is-login');
      app.innerHTML = loginHTML();
      document.getElementById('drawer-root').innerHTML = '';
      updateTitle();
      return;
    }
    document.body.classList.remove('is-login');
    const a = document.activeElement;
    const keep = a && a.dataset && a.dataset.keep, pos = keep ? a.selectionStart : 0;
    if (!app.querySelector('.shell')) app.innerHTML = shellHTML();
    document.getElementById('side').innerHTML = sideHTML();
    document.getElementById('top').innerHTML = topHTML();
    document.getElementById('view').innerHTML = `<div class="view-in v-${ui.view}">${viewHTML()}</div>`;
    renderDrawer();
    if (keep) { const el = document.querySelector(`[data-keep="${keep}"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
    updateTitle(); tickClock();
  }
  function renderDrawer() {
    const root = document.getElementById('drawer-root');
    const o = ui.drawer && DV.order(ui.drawer);
    if (!o || o.restaurantId !== rid || o.status === 'cancelled') { ui.drawer = null; root.innerHTML = ''; return; }
    if (!root.querySelector('.drawer')) root.innerHTML = `<div class="scrim" data-act="close-drawer"></div><aside class="drawer" role="dialog"></aside>`;
    const dr = root.querySelector('.drawer');
    const sc = dr.querySelector('.dr-b') ? dr.querySelector('.dr-b').scrollTop : 0;
    dr.innerHTML = drawerBody(o);
    const b = dr.querySelector('.dr-b'); if (b) b.scrollTop = sc;
  }
  function openModal(html) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal"><div class="scrim" data-act="close-modal"></div>${html}</div>`;
  }
  function closeModal() { document.getElementById('modal-root').innerHTML = ''; ui.pending = null; }
  function tickClock() {
    const el = document.getElementById('clock'); if (!el) return;
    el.textContent = new Date().toLocaleTimeString(LOCALE(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ---------------------------------------------------------------- printing
  function waitImages(root, ms = 1800) {
    const imgs = [...root.querySelectorAll('img')].filter((i) => !i.complete);
    if (!imgs.length) return Promise.resolve();
    return Promise.race([
      Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = r; }))),
      new Promise((r) => setTimeout(r, ms))
    ]);
  }
  function printHTML(html, pageCss, after) {
    const root = document.getElementById('print-root');
    root.innerHTML = html;
    document.getElementById('page-style').textContent = pageCss;
    document.body.classList.add('is-printing');
    let done = false;
    const runAfter = () => { if (done) return; done = true; if (after) after(); };
    const onAfter = () => {
      W.removeEventListener('afterprint', onAfter);
      document.body.classList.remove('is-printing');
      root.innerHTML = ''; document.getElementById('page-style').textContent = '';
      runAfter();
    };
    W.addEventListener('afterprint', onAfter);
    // print() blocks in most browsers; the timer is only a fallback for browsers without afterprint
    waitImages(root).then(() => { W.print(); setTimeout(runAfter, 1500); });
  }
  function doPrintPending() {
    const p = ui.pending; if (!p) return;
    const doc = labelsDoc(p.ids, p.mode, ui.bags);
    if (!doc.count) return;
    const [w, h] = SIZES[ui.size];
    const ids = new Set(doc.orders.map((o) => o.id));
    const mode = p.mode;
    closeModal();
    printHTML(`<div class="lbl-sheet sz-${ui.size}">${doc.html}</div>`, `@page { size: ${w}mm ${h}mm; margin: 0; }`, () => {
      if (mode !== 'labels') return;
      DV.commit((s) => { s.orders.forEach((o) => { if (ids.has(o.id)) o.printed = true; }); });
      DVUI.toast(t('printed_ok'), t('printed_ok_sub', ids.size), '🏷️');
    });
  }
  function openPreview(ids, mode) {
    if (!ids.length) { DVUI.toast(mode === 'unprinted' ? t('nothing_unprinted') : t('nothing_sel'), '', 'ℹ️'); return; }
    ui.pending = { ids, mode: mode === 'bags' ? 'bags' : 'labels' };
    openModal(previewHTML());
  }
  function refreshPreview() { if (ui.pending) openModal(previewHTML()); }

  // ---------------------------------------------------------------- actions
  function setView(v) { ui.view = v; pref.set('view', v); ui.notifOpen = false; render(); const m = document.querySelector('.main'); if (m) m.scrollTop = 0; }
  function tryLogin() {
    if (!ui.loginR) { ui.pinErr = false; DVUI.toast(t('choose_first'), '', '🏪'); return; }
    const r = DV.restaurant(ui.loginR);
    if (!r || String(r.pin || '1234') !== ui.pin) { ui.pinErr = true; ui.pin = ''; render(); const b = document.querySelector('.pin-box'); if (b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } return; }
    rid = r.id; DV.session('restaurant', { rid });
    markSeen('restaurant:' + rid);
    known = null; trackNew();
    ui.pin = ''; ui.pinErr = false; ui.date = DV.today(); ui.sel.clear();
    render();
    DVUI.toast(r.name, t('app'), '👋');
  }
  function logout() {
    DV.session('restaurant', null);
    rid = null; known = null; ui.drawer = null; ui.notifOpen = false; ui.sel.clear(); ui.loginR = null; ui.pin = '';
    closeModal(); render();
  }
  function advance(ids, to) {
    ids = [].concat(ids).filter(Boolean);
    if (!ids.length) return;
    DV.setOrderStatus(ids, to, { by: R().name || 'restaurant' });
    DVUI.toast(t('moved'), `${t('moved_n', ids.length)} → ${statusLabel(to)}`, '✅', 2200);
  }
  function bulk(colId) {
    const col = COLS.find((c) => c.id === colId); if (!col || !col.next) return;
    const ids = applyFilters(myOrders(ui.date)).filter((o) => col.st.includes(o.status)).map((o) => o.id);
    advance(ids, col.next);
  }
  function onNotif(n) {
    if (!rid) return;
    DVUI.toast(DV.L(n.title, lang), DV.L(n.body, lang), n.icon || '🔔', 5200);
    if (soundOn) DVUI.beep(n.icon === '🧾' ? 'order' : 'ding');
  }

  function onClick(e) {
    const pop = e.target.closest('.bell-wrap');
    if (ui.notifOpen && !pop) { ui.notifOpen = false; render(); }
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case 'lang': if (!LANGS.includes(el.dataset.l) || el.dataset.l === lang) break; lang = el.dataset.l; pref.set('lang', lang); applyLang(); render(); refreshPreview(); break;
      case 'pick-r': ui.loginR = id; ui.pinErr = false; render(); break;
      case 'key':
        if (el.dataset.k === 'del') ui.pin = ui.pin.slice(0, -1);
        else if (ui.pin.length < 4) ui.pin += el.dataset.k;
        ui.pinErr = false; render();
        if (ui.pin.length === 4) setTimeout(tryLogin, 120);
        break;
      case 'login': tryLogin(); break;
      case 'logout': logout(); break;
      case 'nav': setView(el.dataset.v); break;
      case 'date': ui.date = el.dataset.d; ui.sel.clear(); render(); break;
      case 'sound': soundOn = !soundOn; pref.set('sound', soundOn ? '1' : '0'); if (soundOn) DVUI.beep('ding'); render(); break;
      case 'bell': ui.notifOpen = !ui.notifOpen; render(); break;
      case 'read-all': DV.markRead('restaurant:' + rid); break;
      case 'read-one': DV.markRead('restaurant:' + rid, id); break;
      case 'slot': ui.slot = el.dataset.s; render(); break;
      case 'lfilter': ui.lblFilter = el.dataset.f; render(); break;
      case 'adv': e.stopPropagation(); advance(id, el.dataset.to); break;
      case 'bulk': bulk(el.dataset.col); break;
      case 'open': ui.drawer = id; renderDrawer(); break;
      case 'close-drawer': ui.drawer = null; renderDrawer(); break;
      case 'print-prep': printHTML(`<div class="prep-print">${prepSheet(ui.date, true)}</div>`, '@page { size: A4; margin: 12mm; }'); break;
      case 'print-unprinted': openPreview(myOrders(ui.date).filter((o) => !o.printed).map((o) => o.id), 'unprinted'); break;
      case 'preview-sel': openPreview([...ui.sel], 'labels'); break;
      case 'preview-bags': { const ids = ui.sel.size ? [...ui.sel] : myOrders(ui.date).map((o) => o.id); openPreview(ids, 'bags'); break; }
      case 'print-one': openPreview([id], 'labels'); break;
      case 'do-print': doPrintPending(); break;
      case 'close-modal': closeModal(); break;
      case 'edit-meal': { const m = DV.meal(id); if (m) openModal(editMealHTML(m)); break; }
    }
  }
  function onChange(e) {
    const el = e.target, k = el.dataset && el.dataset.chg; if (!k) return;
    if (k === 'date') { if (el.value) { ui.date = el.value; ui.sel.clear(); render(); } }
    else if (k === 'size') { ui.size = el.value; pref.set('size', ui.size); render(); refreshPreview(); }
    else if (k === 'bags') { ui.bags = el.checked; pref.set('bags', ui.bags ? '1' : '0'); render(); refreshPreview(); }
    else if (k === 'sel') { el.checked ? ui.sel.add(el.dataset.id) : ui.sel.delete(el.dataset.id); render(); }
    else if (k === 'sel-all') {
      let list = applyFilters(myOrders(ui.date));
      if (ui.lblFilter === 'unprinted') list = list.filter((o) => !o.printed);
      if (ui.lblFilter === 'printed') list = list.filter((o) => o.printed);
      list.forEach((o) => (el.checked ? ui.sel.add(o.id) : ui.sel.delete(o.id))); render();
    } else if (k === 'meal-active') {
      const on = el.checked, id = el.dataset.id;
      DV.commit((s) => { const m = s.meals.find((x) => x.id === id); if (m) m.active = on; });
      DVUI.toast(on ? t('meal_on') : t('meal_off'), DV.L((DV.meal(id) || {}).name, lang), on ? '✅' : '⏸️');
    }
  }
  function onInput(e) {
    const k = e.target.dataset && e.target.dataset.inp;
    if (k === 'q') { ui.q = e.target.value; render(); }
  }
  function onSubmit(e) {
    const f = e.target; if (f.dataset.form !== 'meal') return;
    e.preventDefault();
    const fd = new FormData(f), id = f.dataset.id;
    const n = (k) => Math.max(0, Math.round(Number(fd.get(k)) || 0));
    const patch = { kcal: n('kcal'), protein: n('protein'), carbs: n('carbs'), fat: n('fat'), shelfDays: Math.max(1, n('shelfDays')),
      allergens: fd.getAll('alg').filter((a) => DV.ALLERGENS[a]), desc_ar: String(fd.get('desc_ar') || '').trim(), desc_nl: String(fd.get('desc_nl') || '').trim(), desc_en: String(fd.get('desc_en') || '').trim() };
    DV.commit((s) => {
      const m = s.meals.find((x) => x.id === id); if (!m) return;
      m.kcal = patch.kcal; m.protein = patch.protein; m.carbs = patch.carbs; m.fat = patch.fat; m.shelfDays = patch.shelfDays; m.allergens = patch.allergens;
      m.desc = Object.assign({}, typeof m.desc === 'object' && m.desc ? m.desc : {}, { ar: patch.desc_ar, nl: patch.desc_nl });
      if (patch.desc_en) m.desc.en = patch.desc_en; else delete m.desc.en;
    });
    closeModal();
    DVUI.toast(t('saved'), DV.L((DV.meal(id) || {}).name, lang), '💾');
  }
  function onKey(e) {
    if (e.key === 'Escape') { if (document.getElementById('modal-root').innerHTML) closeModal(); else if (ui.drawer) { ui.drawer = null; renderDrawer(); } else if (ui.notifOpen) { ui.notifOpen = false; render(); } return; }
    if (!rid) {
      if (/^\d$/.test(e.key) && ui.pin.length < 4) { ui.pin += e.key; ui.pinErr = false; render(); if (ui.pin.length === 4) setTimeout(tryLogin, 120); }
      else if (e.key === 'Backspace') { ui.pin = ui.pin.slice(0, -1); render(); }
      else if (e.key === 'Enter') tryLogin();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('ocard')) { e.preventDefault(); ui.drawer = e.target.dataset.id; renderDrawer(); }
  }

  // ---------------------------------------------------------------- boot
  function boot() {
    applyLang();
    const s = DV.session('restaurant');
    if (s && s.rid && DV.restaurant(s.rid)) rid = s.rid;
    markSeen = DVUI.watchInbox(() => 'restaurant:' + (rid || '-'), onNotif) || (() => {});
    trackNew();
    DV.on(() => { trackNew(); render(); });
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey);
    setInterval(tickClock, 1000);
    // roll the "today" tabs over at midnight
    let lastDay = DV.today();
    setInterval(() => { const d = DV.today(); if (d !== lastDay) { if (ui.date === lastDay) ui.date = d; lastDay = d; render(); } }, 60000);
    render();
  }

  // exposed for tests / debugging
  W.DVRestaurant = {
    ui, T, login: (id) => { rid = id; known = null; trackNew(); }, get rid() { return rid; },
    myOrders, prepData, prepSheet, labelHTML, bagHTML, labelsDoc, boardHTML, labelsHTML, menuHTML, statsHTML, statsData, loginHTML, sideHTML, topHTML, drawerBody, editMealHTML, previewHTML,
    setLang: (l) => { lang = LANGS.includes(l) ? l : 'ar'; }
  };

  if (HAS_DOM) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
})();

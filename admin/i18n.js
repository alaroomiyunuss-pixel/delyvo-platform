/* Delyvo admin — i18n: AR / EN dictionaries + t(key, vars).
   Loaded in <head> (before core.js). Values are plain strings with {var} placeholders, or functions (vars) => string
   for English plurals. Vars are inserted raw (callers pass pre-escaped HTML when the result is used as HTML). */
(function () {
  const KEY = 'delyvo.admin.lang';
  const pl = (n, one, many) => (+String(n).replace(/<[^>]*>/g, '') === 1 ? one : many);

  const ar = {
    // ---- generic
    'common.save': 'حفظ', 'common.cancel': 'إلغاء', 'common.close': 'إغلاق', 'common.add': 'إضافة', 'common.edit': 'تعديل', 'common.delete': 'حذف',
    'common.apply': 'تطبيق', 'common.open': 'فتح', 'common.view': 'عرض', 'common.all': 'الكل', 'common.today': 'اليوم',
    'common.noData': 'لا توجد بيانات', 'common.fillRequired': 'أكمل الحقول المطلوبة', 'common.renderError': 'حدث خطأ في عرض هذا القسم',
    'common.badValue': 'قيمة غير صحيحة', 'common.between': 'بين {a} و {b}', 'common.saved': 'تم الحفظ',
    'common.nDays': '{n} يوم', 'common.nResults': '{n} نتيجة', 'common.refundedAmt': 'مرتجع {a}', 'common.chefPick': 'اختيار الشيف',
    'common.listSep': '، ', 'common.deleteConfirm': 'حذف {name}؟',
    'lang.ar': 'عربي', 'lang.nl': 'Nederlands', 'lang.en': 'English',
    'ago.now': 'الآن', 'ago.min': 'قبل {n} د', 'ago.hour': 'قبل {n} س', 'ago.day': 'قبل {n} يوم',
    'weekdays': 'الأحد,الإثنين,الثلاثاء,الأربعاء,الخميس,الجمعة,السبت',
    'weekdaysShort': 'الأحد,الإثن,الثلا,الأرب,الخمي,الجمع,السبت',
    'pay.card': 'بطاقة', 'pay.cash': 'نقداً', 'pay.wallet': 'المحفظة',
    'subst.active': 'فعّال', 'subst.completed': 'مكتمل', 'subst.cancelled': 'ملغي', 'subst.paused': 'موقوف',
    'st.scheduled': 'مؤكد',
    'cutoff.midnight': 'منتصف الليل 00:00',
    'kind.customer': 'عميل', 'kind.sub': 'اشتراك', 'kind.order': 'طلب', 'kind.meal': 'وجبة', 'kind.restaurant': 'مطعم',
    'goal.balanced': 'متوازن', 'goal.lose': 'خسارة وزن', 'goal.gain': 'زيادة عضل',
    'veh.e-bike': 'دراجة كهربائية', 'veh.scooter': 'سكوتر', 'veh.car': 'سيارة', 'veh.bike': 'دراجة',
    'f.allRest': 'كل المطاعم', 'f.allStatus': 'كل الحالات', 'f.allDrivers': 'كل السائقين', 'f.allCities': 'كل المدن', 'f.allPlans': 'كل الباقات',
    'f.lunchDinner': 'غداء + عشاء', 'f.clear': 'مسح الفلاتر',

    // ---- shell / static html
    'app.docTitle': 'Delyvo — لوحة الأدمن', 'app.panel': 'لوحة الأدمن',
    'sb.otherApps': 'التطبيقات الأخرى', 'sb.customerApp': '📱 تطبيق العميل', 'sb.driverApp': '🛵 تطبيق السائق', 'sb.restApp': '🍳 لوحة المطعم', 'sb.home': '🏠 الصفحة الرئيسية',
    'tb.menu': 'القائمة', 'tb.searchPh': 'ابحث عن عميل، طلب (DV…)، اشتراك (SUB-…)', 'tb.customer': 'العميل ↗', 'tb.driver': 'السائق ↗', 'tb.restaurant': 'المطعم ↗',
    'tb.lang': 'اللغة', 'app.reset': 'إعادة ضبط البيانات التجريبية',
    'app.resetConfirm': 'إعادة ضبط كل البيانات التجريبية؟\nسيتم مسح كل التعديلات والطلبات في كل التطبيقات المفتوحة.',
    'app.resetDone': 'تمت إعادة ضبط البيانات', 'app.resetDoneSub': 'كل التطبيقات متزامنة الآن',
    'search.none': 'لا توجد نتائج لـ “{q}”',
    'bell.title': 'الإشعارات', 'bell.readAll': 'تعليم الكل كمقروء', 'bell.empty': 'لا توجد إشعارات',
    'nav.g.ops': 'التشغيل', 'nav.g.cat': 'الكتالوج والمبيعات', 'nav.g.sys': 'النظام',
    'nav.dashboard': 'الرئيسية', 'nav.operations': 'العمليات اليومية', 'nav.drivers': 'السائقون', 'nav.subscriptions': 'الاشتراكات',
    'nav.customers': 'العملاء', 'nav.reviews': 'التقييمات', 'nav.restaurants': 'المطاعم الشريكة', 'nav.meals': 'الوجبات',
    'nav.plans': 'الباقات والأسعار', 'nav.marketing': 'التسويق', 'nav.settings': 'الإعدادات',

    // ---- dashboard
    'dash.hi.morning': 'صباح الخير', 'dash.hi.afternoon': 'مساء الخير', 'dash.hi.evening': 'مساء الخير',
    'dash.sub': 'نظرة عامة على التشغيل اليوم', 'dash.todayOps': 'عمليات اليوم',
    'dash.kpi.activeSubs': 'الاشتراكات الفعّالة', 'dash.kpi.totalSubs': '{n} إجمالي الاشتراكات',
    'dash.kpi.todayMeals': 'وجبات اليوم', 'dash.kpi.lunchDinner': '{l} غداء · {d} عشاء', 'dash.kpi.deliveries': 'التوصيلات اليوم',
    'dash.kpi.revenue': 'إيراد الشهر', 'dash.kpi.paidSubs': '{n} اشتراك مدفوع', 'dash.kpi.avgRating': 'متوسط تقييم الوجبات',
    'dash.kpi.fromN': 'من {n} تقييم', 'dash.kpi.activeRest': 'المطاعم الفعّالة', 'dash.kpi.activeMeals': '{n} وجبة فعّالة في الكتالوج',
    'dash.rev14': 'الإيرادات — آخر ١٤ يوم', 'dash.byPayDate': 'حسب تاريخ الدفع', 'dash.planMix': 'توزيع الباقات', 'dash.subsUnit': 'اشتراك',
    'dash.pipeline': 'خط سير طلبات اليوم', 'dash.pipelineSub': 'عدد الطلبات في كل مرحلة', 'dash.openOps': 'فتح العمليات',
    'dash.mealsByRest': 'وجبات اليوم حسب المطعم', 'dash.internalNote': 'داخلي — العميل لا يرى أسماء المطاعم', 'dash.nReady': '{n} جاهزة',
    'dash.alerts': 'تنبيهات', 'dash.alertsSub': 'أمور تحتاج تدخلك', 'dash.assign': 'توزيع',
    'dash.al.noDriver': '{n} طلب اليوم بدون سائق', 'dash.al.noDriverSub': 'وزّعها تلقائياً حسب المدينة أو يدوياً من العمليات',
    'dash.al.noPick': '{name} لم يختر وجبة', 'dash.al.chefPicks': 'الشيف يختار تلقائياً بعد الموعد النهائي',
    'dash.al.moreDays': '{n} أيام أخرى بدون اختيار', 'dash.al.failed': 'تعذّر توصيل {no}', 'dash.al.rating': 'تقييم {r}/5',
    'dash.al.allGood': 'كل شيء تحت السيطرة', 'dash.al.none': 'لا توجد تنبيهات حالياً',
    'dash.activity': 'آخر النشاطات', 'dash.activitySub': 'إشعارات الأدمن', 'dash.allNotifs': 'كل الإشعارات', 'dash.noActivity': 'لا يوجد نشاط بعد',

    // ---- operations
    'ops.autoAssign': 'توزيع تلقائي على السائقين', 'ops.noMealAssigned': 'بدون وجبة محددة', 'ops.noMeal': 'بدون وجبة', 'ops.noDriver': 'بدون سائق',
    'ops.noDriverOpt': '— بدون سائق —', 'ops.notSetYet': 'لم تُحدد بعد', 'ops.noMatch': 'لا توجد طلبات مطابقة', 'ops.noMatchSub': 'غيّر التاريخ أو الفلاتر',
    'ops.th.no': 'رقم', 'ops.th.customer': 'العميل', 'ops.th.city': 'المدينة', 'ops.th.slot': 'غداء/عشاء', 'ops.th.meal': 'الصنف · المطعم',
    'ops.th.window': 'نافذة التوصيل', 'ops.th.status': 'الحالة', 'ops.th.driver': 'السائق', 'ops.th.change': 'تغيير الحالة',
    'ops.grp.rest': '{n} وجبة · {r} جاهزة · {p} قيد التحضير', 'ops.grp.driver': '{n} طلب · {d} تم توصيلها · {r} جاهزة/في الطريق',
    'ops.nLunch': '{n} غداء', 'ops.nDinner': '{n} عشاء', 'ops.nActive': '{n} طلب فعّال', 'ops.nNoDriver': '{n} بدون سائق', 'ops.nOrders': '{n} طلبات',
    'ops.prevDay': 'اليوم السابق', 'ops.nextDay': 'اليوم التالي', 'ops.searchPh': 'بحث: رقم الطلب، العميل، الوجبة',
    'ops.g.list': 'قائمة', 'ops.g.rest': 'حسب المطعم', 'ops.g.driver': 'حسب السائق',
    'ops.selected': 'محدد {n}', 'ops.pickDriver': 'اختر سائق…', 'ops.assignBtn': 'إسناد', 'ops.changeStatus': 'تغيير الحالة…', 'ops.clearSel': 'إلغاء التحديد',
    'ops.t.assigned': 'تم توزيع {n} طلب على السائقين', 'ops.t.allAssigned': 'كل الطلبات لديها سائق بالفعل', 'ops.t.byZone': 'حسب منطقة كل سائق',
    'ops.t.assignedTo': 'تم الإسناد إلى {name}', 'ops.t.driverRemoved': 'تمت إزالة السائق',
    'ops.failReason': 'سبب تعذّر التوصيل؟', 'ops.failReasonDef': 'العميل غير موجود', 'ops.cancelConfirm': 'إلغاء {n} طلب؟',
    'ops.t.updated': 'تم تحديث {what}', 'ops.t.pickDriverFirst': 'اختر سائقاً أولاً', 'ops.t.bulkAssigned': 'تم إسناد {n} طلب', 'ops.t.pickStatusFirst': 'اختر الحالة أولاً',

    // ---- reviews
    'rev.sub': 'كل الطلبات المقيَّمة من العملاء — {n} تقييم، {c} مع تعليق', 'rev.avgAll': 'متوسط كل التقييمات', 'rev.byRest': 'حسب المطعم',
    'rev.nRatings': '{n} تقييم', 'rev.allRatings': 'كل التقييمات', 'rev.low': '⚠ منخفضة (١–٢)', 'rev.nStars': '{n} نجوم', 'rev.noMatch': 'لا توجد تقييمات مطابقة',
    'rev.th.date': 'التاريخ', 'rev.th.rating': 'التقييم', 'rev.th.comment': 'التعليق', 'rev.th.meal': 'الوجبة', 'rev.th.rest': 'المطعم', 'rev.th.customer': 'العميل', 'rev.th.order': 'الطلب',

    // ---- subscriptions
    'sub.searchPh': 'بحث بالكود أو اسم العميل', 'sub.noMatch': 'لا توجد اشتراكات مطابقة', 'sub.postponedN': 'تأجيل',
    'sub.th.code': 'الكود', 'sub.th.customer': 'العميل', 'sub.th.plan': 'الباقة', 'sub.th.days': 'الأيام', 'sub.th.meals': 'الوجبات', 'sub.th.start': 'البداية',
    'sub.th.progress': 'التقدم', 'sub.th.status': 'الحالة', 'sub.th.paid': 'المدفوع', 'sub.th.payment': 'الدفع',
    'sub.hasAllergen': 'يحتوي مسبب حساسية', 'sub.notPicked': 'لم يُختر بعد', 'sub.changeMeal': 'تغيير الوجبة…', 'sub.pickMeal': 'اختر وجبة…',
    'sub.postponed': 'مؤجَّل', 'sub.movedFrom': 'منقول من', 'sub.locked': 'مقفل', 'sub.postponeDay': 'تأجيل اليوم',
    'sub.duration': 'المدة', 'sub.address': 'العنوان', 'sub.progLine': '{d} يوم · {m} وجبة · تأجيلات {p}',
    'sub.basePrice': 'السعر الأساسي ({n} وجبة)', 'sub.durDisc': 'خصم المدة', 'sub.optDisc': 'خصم الغداء + العشاء', 'sub.deliveryFee': 'رسوم التوصيل',
    'sub.promo': 'كود الخصم', 'sub.totalPaid': 'الإجمالي المدفوع', 'sub.vatLine': 'شامل ضريبة {v} · {p} للوجبة', 'sub.refund': 'استرداد',
    'sub.notes': 'ملاحظات', 'sub.custNote': 'ملاحظة العميل', 'sub.notePh': 'أضف ملاحظة داخلية…', 'sub.schedule': 'الجدول اليومي',
    'sub.changeUntil': 'التغيير مسموح حتى {h} في اليوم السابق', 'sub.changeUntilMidnight': 'التغيير مسموح حتى منتصف الليل 00:00 قبل يوم التوصيل',
    'sub.cancel': 'إلغاء الاشتراك', 'sub.refundDemo': 'استرداد مبلغ (تجريبي)',
    'sub.t.cantChange': 'لا يمكن التغيير', 'sub.t.dayLocked': 'هذا اليوم مقفل (تجاوز الموعد النهائي)', 'sub.t.mealChanged': 'تم تغيير الوجبة',
    'sub.postponeConfirm': 'تأجيل يوم {d}؟ سيُضاف يوم بديل في نهاية الاشتراك.', 'sub.t.postponed': 'تم التأجيل', 'sub.t.newDay': 'اليوم البديل: {d}',
    'sub.t.postponeFail': 'تعذّر التأجيل', 'sub.t.locked': 'اليوم مقفل', 'sub.t.limit': 'تم تجاوز الحد الأقصى للتأجيل', 'sub.t.noDay': 'اليوم غير موجود',
    'sub.t.noteFirst': 'اكتب الملاحظة أولاً', 'sub.t.noteAdded': 'تمت إضافة الملاحظة',
    'sub.cancelConfirm': 'إلغاء الاشتراك {code}؟ سيتم إلغاء كل الطلبات القادمة غير المقفلة.', 'sub.t.cancelled': 'تم إلغاء الاشتراك', 'sub.t.nCancelled': '{n} طلب قادم أُلغي',
    'sub.refundTitle': 'استرداد مبلغ', 'sub.refundDo': 'تنفيذ الاسترداد', 'sub.refundNote': 'عملية تجريبية — لا يتم تحويل أموال حقيقية. المقترح = الوجبات غير المُحضّرة × سعر الوجبة.',
    'sub.amount': 'المبلغ (€)', 'sub.reason': 'السبب', 'sub.refundMax': 'الحد الأقصى: {m} · المتبقي من الوجبات: {r}',
    'sub.rr.cancel': 'إلغاء الاشتراك', 'sub.rr.missing': 'وجبة لم تصل', 'sub.rr.quality': 'جودة الوجبة', 'sub.rr.goodwill': 'تعويض', 'sub.rr.other': 'أخرى',
    'sub.t.badAmount': 'المبلغ غير صحيح', 'sub.t.refunded': 'تم الاسترداد',

    // ---- customers
    'cust.sub': '{n} عميل · {a} لديهم اشتراك فعّال', 'cust.searchPh': 'بحث بالاسم، الهاتف، البريد', 'cust.noMatch': 'لا يوجد عملاء مطابقون',
    'cust.th.customer': 'العميل', 'cust.th.phone': 'الهاتف', 'cust.th.city': 'المدينة', 'cust.th.allergies': 'الحساسية', 'cust.th.subs': 'اشتراكات',
    'cust.th.delivered': 'وجبات مُسلّمة', 'cust.th.spent': 'إجمالي الإنفاق', 'cust.th.joined': 'التسجيل',
    'cust.activeSubs': 'اشتراكات فعّالة', 'cust.avgRating': 'متوسط تقييمه', 'cust.goal': 'الهدف', 'cust.lang': 'اللغة',
    'cust.addresses': 'العناوين', 'cust.noAddr': 'لا توجد عناوين', 'cust.allergiesEdit': 'الحساسية (اضغط للتعديل)', 'cust.dislikes': 'لا يحب',
    'cust.noSubs': 'لا توجد اشتراكات', 'cust.upcoming': 'الطلبات القادمة', 'cust.past': 'الطلبات السابقة والتقييمات', 'cust.noOrders': 'لا توجد طلبات بعد',
    'cust.notify': 'إرسال إشعار لهذا العميل', 'cust.notifyTitlePh': 'العنوان — مثال: هدية لك 🎁', 'cust.notifyBodyPh': 'نص الرسالة',
    'cust.sendToApp': 'إرسال للتطبيق', 'cust.lastNotifs': 'آخر إشعارات العميل',
    'cust.t.allergies': 'تم تحديث الحساسية', 'cust.t.titleFirst': 'اكتب عنوان الإشعار', 'cust.t.sent': 'تم إرسال الإشعار',

    // ---- drivers
    'drv.sub': '{n} متصل من {of}', 'drv.assignToday': 'توزيع طلبات اليوم', 'drv.new': 'سائق جديد',
    'drv.th.driver': 'السائق', 'drv.th.vehicle': 'المركبة', 'drv.th.zone': 'المنطقة', 'drv.th.online': 'متصل', 'drv.th.assigned': 'اليوم: مُسند',
    'drv.th.delivered': 'تم توصيله', 'drv.th.live': 'قيد التنفيذ', 'drv.orders': 'طلباته',
    'drv.t.online': 'السائق متصل', 'drv.t.offline': 'السائق غير متصل', 'drv.editTitle': 'تعديل السائق',
    'drv.f.name': 'الاسم', 'drv.f.plate': 'رقم اللوحة', 'drv.f.pin': 'رمز الدخول PIN (4 أرقام)', 'drv.f.onlineNow': 'متصل الآن',
    'drv.delete': 'حذف السائق', 'drv.deleteConfirm': 'حذف {name}؟ سيتم إزالة إسناده من الطلبات غير المُسلّمة.', 'drv.t.deleted': 'تم حذف السائق',
    'drv.t.nameReq': 'اكتب اسم السائق', 'drv.t.pinBad': 'PIN يجب أن يكون ٤–٦ أرقام', 'drv.t.saved': 'تم حفظ السائق', 'drv.t.added': 'تمت إضافة السائق',

    // ---- restaurants
    'rest.sub': 'Delyvo بدون مطبخ — كل الوجبات من مطاعم شريكة. العميل لا يرى أسماء المطاعم.', 'rest.new': 'مطعم جديد', 'rest.newTitle': 'مطعم شريك جديد',
    'rest.kpi.active': 'مطاعم فعّالة', 'rest.kpi.delivered': 'وجبات مُسلّمة هذا الشهر', 'rest.kpi.payout': 'مستحقات المطاعم هذا الشهر', 'rest.kpi.payoutSub': 'عدد الوجبات × تكلفة الوجبة',
    'rest.offNote': 'موقوف — وجباته مخفية عن العملاء', 'rest.cost': 'تكلفة الوجبة', 'rest.todayOrders': 'طلبات اليوم',
    'rest.monthDelivered': 'مُسلّمة هذا الشهر', 'rest.monthPayout': 'المستحق هذا الشهر',
    'rest.pauseConfirm': 'إيقاف {name}؟ ستُخفى وجباته فوراً من تطبيق العميل.', 'rest.pauseUpcoming': '⚠ لديه {n} طلب قادم — راجعها من الاشتراكات.',
    'rest.t.activated': 'تم تفعيل المطعم', 'rest.t.paused': 'تم إيقاف المطعم',
    'rest.f.name': 'اسم المطعم', 'rest.f.cuisine': 'المطبخ', 'rest.f.cuisinePh': 'عربي / تركي / صحي…', 'rest.f.contact': 'الشخص المسؤول',
    'rest.f.cost': 'ما تدفعه Delyvo لكل وجبة (€)', 'rest.f.pin': 'PIN لوحة المطعم', 'rest.f.color': 'لون التمييز', 'rest.f.active': 'فعّال (وجباته ظاهرة للعملاء)',
    'rest.t.nameReq': 'اكتب اسم المطعم', 'rest.t.costBad': 'تكلفة الوجبة غير صحيحة', 'rest.t.added': 'تمت إضافة المطعم', 'rest.t.saved': 'تم حفظ المطعم',

    // ---- meals
    'meal.catalog': 'كتالوج الوجبات', 'meal.sub': '{n} وجبة فعّالة من {of} · المطعم المورّد ظاهر للإدارة فقط', 'meal.new': 'وجبة جديدة',
    'meal.searchPh': 'بحث باسم الوجبة (ar / nl / en)', 'meal.f.on': 'فعّالة', 'meal.f.off': 'موقوفة', 'meal.nMeals': '{n} وجبة',
    'meal.th.supplier': 'المطعم المورّد', 'meal.th.plans': 'الباقات', 'meal.th.slot': 'الفترة', 'meal.th.nutrition': 'القيم الغذائية',
    'meal.th.allergens': 'مسببات الحساسية', 'meal.th.margin': 'الهامش / وجبة', 'meal.th.active': 'فعّالة',
    'meal.restCost': 'تكلفة المطعم', 'meal.restPaused': 'المطعم موقوف', 'meal.cost': 'تكلفة', 'meal.none': 'خالٍ', 'meal.noMatch': 'لا توجد وجبات مطابقة',
    'meal.t.visible': 'الوجبة ظاهرة للعملاء', 'meal.t.hidden': 'تم إخفاء الوجبة',
    'img.label': 'رابط الصورة أو اختر من المكتبة', 'img.ph': '../assets/img/meals/…jpg أو https://…',
    'meal.f.name': 'اسم الوجبة', 'meal.f.desc': 'الوصف', 'meal.f.ingr': 'المكونات', 'meal.f.supplier': 'المطعم المورّد (داخلي — لا يظهر للعميل)',
    'meal.f.margin': 'الهامش لكل وجبة', 'meal.f.kcal': 'سعرات (kcal)', 'meal.f.protein': 'بروتين (g)', 'meal.f.carbs': 'كربوهيدرات (g)', 'meal.f.fat': 'دهون (g)',
    'meal.f.allergens': 'مسببات الحساسية (١٤ حسب قانون الاتحاد الأوروبي)', 'meal.f.tags': 'الوسوم', 'meal.f.active': 'فعّالة — ظاهرة للعملاء في الباقات المحددة',
    'meal.t.pickPlan': 'اختر باقة واحدة على الأقل', 'meal.t.nameArReq': 'اكتب اسم الوجبة بالعربي', 'meal.t.pickSlot': 'اختر غداء أو عشاء',
    'meal.t.pickImg': 'اختر صورة للوجبة', 'meal.t.added': 'تمت إضافة الوجبة', 'meal.t.saved': 'تم حفظ الوجبة',

    // ---- plans
    'plan.sub': 'أي تعديل هنا يظهر فوراً في تطبيق العميل وحساب السعر عند الدفع', 'plan.perMealPrice': '{p} للوجبة', 'plan.meal': 'وجبة', 'plan.save': 'وفّر {a}',
    'plan.nActiveSubs': '{n} اشتراك فعّال', 'plan.f.price': 'سعر الوجبة (€)', 'plan.f.margin': 'هامش تقريبي', 'plan.avgCost': 'متوسط تكلفة المطعم {a}',
    'plan.f.name': 'الاسم', 'plan.f.desc': 'الوصف', 'plan.f.icon': 'الأيقونة', 'plan.f.kcal': 'السعرات', 'plan.f.color': 'اللون',
    'plan.durDiscounts': 'خصومات المدة', 'plan.durDiscountsSub': 'تُطبّق على السعر الأساسي', 'plan.discountPct': 'الخصم %', 'plan.badgeAr': 'الشارة (عربي)',
    'plan.mealOptions': 'خيارات الوجبات', 'plan.mealOptionsSub': 'خصم إضافي عند اختيار الغداء + العشاء', 'plan.option': 'الخيار', 'plan.mealsPerDay': 'الوجبات يومياً',
    'plan.vatNote': 'الضريبة {v} مشمولة في الأسعار · رسوم التوصيل حسب المنطقة من الإعدادات',
    'plan.preview': 'معاينة الأسعار الحية', 'plan.previewSub': 'محسوبة بـ DV.price لمدينة Rotterdam بدون كود خصم — نفس ما يراه العميل عند الدفع',
    'plan.t.updated': 'تم تحديث الأسعار في تطبيق العميل',

    // ---- marketing
    'mkt.sub': 'البانرات تظهر في الصفحة الرئيسية لتطبيق العميل فوراً', 'mkt.banners': 'بانرات الصفحة الرئيسية', 'mkt.bannersSub': '{n} ظاهر من {of} · رتّبها بالأسهم',
    'mkt.newBanner': 'بانر جديد', 'mkt.editBanner': 'تعديل البانر', 'mkt.moveUp': 'تقديم', 'mkt.moveDown': 'تأخير', 'mkt.noBanners': 'لا توجد بانرات',
    'mkt.promos': 'أكواد الخصم', 'mkt.promosSub': 'تُطبّق عند الدفع في تطبيق العميل', 'mkt.newPromo': 'كود جديد', 'mkt.newPromoTitle': 'كود خصم جديد',
    'mkt.th.type': 'النوع', 'mkt.th.value': 'القيمة', 'mkt.th.uses': 'الاستخدامات', 'mkt.th.note': 'ملاحظة', 'mkt.th.active': 'فعّال',
    'mkt.percent': 'نسبة مئوية', 'mkt.fixed': 'مبلغ ثابت', 'mkt.noPromos': 'لا توجد أكواد', 'mkt.usedN': 'استُخدم {n} مرة',
    'mkt.broadcast': 'إشعار جماعي', 'mkt.broadcastSub': 'يصل فوراً إلى صندوق إشعارات التطبيق المختار',
    'mkt.allCustomers': 'كل العملاء', 'mkt.allDrivers': 'كل السائقين', 'mkt.allRestaurants': 'كل المطاعم',
    'mkt.f.title': 'العنوان', 'mkt.f.body': 'النص', 'mkt.f.subtitle': 'النص الفرعي', 'mkt.f.bg': 'لون الخلفية', 'mkt.f.visible': 'ظاهر في التطبيق', 'mkt.f.internalNote': 'ملاحظة داخلية',
    'mkt.langNote': 'العميل يرى النسخة بلغة تطبيقه. الحقول الفارغة تأخذ النص العربي.',
    'mkt.sendTo.customers': 'إرسال إلى {n} عميل', 'mkt.sendTo.drivers': 'إرسال إلى {n} سائق', 'mkt.sendTo.restaurants': 'إرسال إلى {n} مطعم',
    'mkt.previewTitle': 'عنوان الإشعار', 'mkt.previewBody': 'نص الرسالة يظهر هنا', 'mkt.preview': 'معاينة', 'mkt.livePreview': 'معاينة حية',
    'mkt.bannerTitlePh': 'عنوان البانر', 'mkt.deleteBanner': 'حذف البانر', 'mkt.deleteBannerConfirm': 'حذف هذا البانر؟', 'mkt.deletePromo': 'حذف الكود',
    'mkt.sendConfirm': 'إرسال الإشعار الآن؟',
    'mkt.t.titleArReq': 'اكتب عنوان الإشعار', 'mkt.t.sent': 'تم الإرسال إلى {n}', 'mkt.t.bannerOn': 'البانر ظاهر الآن', 'mkt.t.bannerOff': 'تم إخفاء البانر',
    'mkt.t.bannerDeleted': 'تم حذف البانر', 'mkt.t.bannerTitleReq': 'اكتب عنوان البانر', 'mkt.t.bannerAdded': 'تمت إضافة البانر', 'mkt.t.bannerSaved': 'تم حفظ البانر',
    'mkt.t.promoOn': 'الكود فعّال', 'mkt.t.promoOff': 'تم إيقاف الكود', 'mkt.t.promoDeleted': 'تم حذف الكود', 'mkt.t.codeBad': 'الكود: ٣–٢٠ حرف لاتيني/رقم',
    'mkt.t.codeExists': 'الكود موجود مسبقاً', 'mkt.t.promoAdded': 'تمت إضافة الكود', 'mkt.t.promoSaved': 'تم حفظ الكود',

    // ---- settings
    'set.sub': 'تُحفظ تلقائياً عند تغيير أي حقل وتنعكس على كل التطبيقات', 'set.rules': 'قواعد الطلب والتعديل', 'set.rulesSub': 'متى يقدر العميل يغيّر أو يؤجل',
    'set.cutoff': 'آخر موعد للتعديل', 'set.minLead': 'أقل مدة قبل البدء (أيام)', 'set.maxPostpones': 'الحد الأقصى للتأجيل',
    'set.cutoffEx': 'مثال: التعديل على وجبة الخميس مسموح حتى الأربعاء {h}.',
    'set.cutoffEx24': 'مثال: التعديل على وجبة الخميس مسموح حتى منتصف الليل (00:00) ليلة الأربعاء على الخميس.',
    'set.cutoffExTail': 'بعد ذلك يختار الشيف تلقائياً للأيام بدون اختيار.',
    'set.weekdays': 'أيام التوصيل', 'set.finance': 'المالية والدعم', 'set.vat': 'نسبة الضريبة (BTW)', 'set.whatsapp': 'واتساب الدعم',
    'set.demo': 'بيانات تجريبية', 'set.demoSub': 'تمسح كل التعديلات والطلبات وتعيد البيانات الأصلية في كل التطبيقات.',
    'set.windows': 'نوافذ التوصيل', 'set.windowsSub': 'النص الذي يراه العميل والسائق', 'set.id': 'المعرّف',
    'set.zones': 'مناطق التوصيل ورسومها', 'set.zonesSub': 'الرسوم لكل يوم توصيل — تُضاف لسعر الاشتراك', 'set.th.fee': 'رسوم التوصيل / يوم', 'set.th.customers': 'عملاء',
    'set.newCity': 'مدينة جديدة', 'set.addZone': 'إضافة منطقة',
    'set.t.saved': 'تم حفظ الإعداد', 'set.t.oneDay': 'يجب اختيار يوم واحد على الأقل', 'set.t.weekdays': 'تم تحديث أيام التوصيل', 'set.t.window': 'تم حفظ نافذة التوصيل',
    'set.t.fee': 'تم حفظ الرسوم', 'set.zoneDelConfirm': 'حذف منطقة {city}؟', 'set.t.cityReq': 'اكتب اسم المدينة', 'set.t.cityExists': 'المدينة موجودة', 'set.t.zoneAdded': 'تمت إضافة المنطقة'
  };

  const en = {
    // ---- generic
    'common.save': 'Save', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.add': 'Add', 'common.edit': 'Edit', 'common.delete': 'Delete',
    'common.apply': 'Apply', 'common.open': 'Open', 'common.view': 'View', 'common.all': 'All', 'common.today': 'Today',
    'common.noData': 'No data yet', 'common.fillRequired': 'Please complete the required fields', 'common.renderError': 'Something went wrong while rendering this section',
    'common.badValue': 'Invalid value', 'common.between': 'Between {a} and {b}', 'common.saved': 'Saved',
    'common.nDays': (v) => `${v.n} ${pl(v.n, 'day', 'days')}`, 'common.nResults': (v) => `${v.n} ${pl(v.n, 'result', 'results')}`,
    'common.refundedAmt': '{a} refunded', 'common.chefPick': "Chef's pick", 'common.listSep': ', ', 'common.deleteConfirm': 'Delete {name}?',
    'lang.ar': 'Arabic', 'lang.nl': 'Dutch', 'lang.en': 'English',
    'ago.now': 'just now', 'ago.min': '{n}m ago', 'ago.hour': '{n}h ago', 'ago.day': '{n}d ago',
    'weekdays': 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    'weekdaysShort': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
    'pay.card': 'Card', 'pay.cash': 'Cash', 'pay.wallet': 'Wallet',
    'subst.active': 'Active', 'subst.completed': 'Completed', 'subst.cancelled': 'Cancelled', 'subst.paused': 'Paused',
    'st.scheduled': 'Confirmed',
    'cutoff.midnight': 'Midnight (00:00)',
    'kind.customer': 'Customer', 'kind.sub': 'Subscription', 'kind.order': 'Order', 'kind.meal': 'Meal', 'kind.restaurant': 'Restaurant',
    'goal.balanced': 'Balanced', 'goal.lose': 'Weight loss', 'goal.gain': 'Muscle gain',
    'veh.e-bike': 'E-bike', 'veh.scooter': 'Scooter', 'veh.car': 'Car', 'veh.bike': 'Bicycle',
    'f.allRest': 'All restaurants', 'f.allStatus': 'All statuses', 'f.allDrivers': 'All drivers', 'f.allCities': 'All cities', 'f.allPlans': 'All plans',
    'f.lunchDinner': 'Lunch + dinner', 'f.clear': 'Clear filters',

    // ---- shell / static html
    'app.docTitle': 'Delyvo — Admin', 'app.panel': 'Admin panel',
    'sb.otherApps': 'Other apps', 'sb.customerApp': '📱 Customer app', 'sb.driverApp': '🛵 Driver app', 'sb.restApp': '🍳 Restaurant panel', 'sb.home': '🏠 Home page',
    'tb.menu': 'Menu', 'tb.searchPh': 'Search customers, orders (DV…), subscriptions (SUB-…)', 'tb.customer': 'Customer ↗', 'tb.driver': 'Driver ↗', 'tb.restaurant': 'Restaurant ↗',
    'tb.lang': 'Language', 'app.reset': 'Reset demo data',
    'app.resetConfirm': 'Reset all demo data?\nAll changes and orders will be wiped in every open app.',
    'app.resetDone': 'Demo data reset', 'app.resetDoneSub': 'All apps are in sync now',
    'search.none': 'No results for “{q}”',
    'bell.title': 'Notifications', 'bell.readAll': 'Mark all as read', 'bell.empty': 'No notifications',
    'nav.g.ops': 'Operations', 'nav.g.cat': 'Catalogue & sales', 'nav.g.sys': 'System',
    'nav.dashboard': 'Dashboard', 'nav.operations': 'Daily operations', 'nav.drivers': 'Drivers', 'nav.subscriptions': 'Subscriptions',
    'nav.customers': 'Customers', 'nav.reviews': 'Reviews', 'nav.restaurants': 'Partner restaurants', 'nav.meals': 'Meals',
    'nav.plans': 'Plans & pricing', 'nav.marketing': 'Marketing', 'nav.settings': 'Settings',

    // ---- dashboard
    'dash.hi.morning': 'Good morning', 'dash.hi.afternoon': 'Good afternoon', 'dash.hi.evening': 'Good evening',
    'dash.sub': "Overview of today's operations", 'dash.todayOps': "Today's operations",
    'dash.kpi.activeSubs': 'Active subscriptions', 'dash.kpi.totalSubs': '{n} subscriptions in total',
    'dash.kpi.todayMeals': "Today's meals", 'dash.kpi.lunchDinner': '{l} lunch · {d} dinner', 'dash.kpi.deliveries': "Today's deliveries",
    'dash.kpi.revenue': 'Revenue this month', 'dash.kpi.paidSubs': (v) => `${v.n} paid ${pl(v.n, 'subscription', 'subscriptions')}`, 'dash.kpi.avgRating': 'Average meal rating',
    'dash.kpi.fromN': (v) => `from ${v.n} ${pl(v.n, 'rating', 'ratings')}`, 'dash.kpi.activeRest': 'Active restaurants', 'dash.kpi.activeMeals': '{n} active meals in the catalogue',
    'dash.rev14': 'Revenue — last 14 days', 'dash.byPayDate': 'By payment date', 'dash.planMix': 'Plan mix', 'dash.subsUnit': 'subscriptions',
    'dash.pipeline': "Today's order pipeline", 'dash.pipelineSub': 'Number of orders at each stage', 'dash.openOps': 'Open operations',
    'dash.mealsByRest': "Today's meals by restaurant", 'dash.internalNote': 'Internal — customers never see restaurant names', 'dash.nReady': '{n} ready',
    'dash.alerts': 'Alerts', 'dash.alertsSub': 'Things that need your attention', 'dash.assign': 'Assign',
    'dash.al.noDriver': (v) => `${v.n} ${pl(v.n, 'order', 'orders')} today without a driver`, 'dash.al.noDriverSub': 'Auto-assign them by city, or assign manually from Operations',
    'dash.al.noPick': "{name} hasn't picked a meal", 'dash.al.chefPicks': 'the chef picks automatically after the cutoff',
    'dash.al.moreDays': (v) => `${v.n} more ${pl(v.n, 'day', 'days')} without a selection`, 'dash.al.failed': 'Delivery failed: {no}', 'dash.al.rating': 'Rated {r}/5',
    'dash.al.allGood': 'Everything is under control', 'dash.al.none': 'No alerts right now',
    'dash.activity': 'Recent activity', 'dash.activitySub': 'Admin notifications', 'dash.allNotifs': 'All notifications', 'dash.noActivity': 'No activity yet',

    // ---- operations
    'ops.autoAssign': 'Auto-assign drivers', 'ops.noMealAssigned': 'No meal selected', 'ops.noMeal': 'No meal', 'ops.noDriver': 'No driver',
    'ops.noDriverOpt': '— No driver —', 'ops.notSetYet': 'Not selected yet', 'ops.noMatch': 'No matching orders', 'ops.noMatchSub': 'Change the date or filters',
    'ops.th.no': 'No.', 'ops.th.customer': 'Customer', 'ops.th.city': 'City', 'ops.th.slot': 'Lunch/Dinner', 'ops.th.meal': 'Dish · Restaurant',
    'ops.th.window': 'Delivery window', 'ops.th.status': 'Status', 'ops.th.driver': 'Driver', 'ops.th.change': 'Change status',
    'ops.grp.rest': (v) => `${v.n} ${pl(v.n, 'meal', 'meals')} · ${v.r} ready · ${v.p} preparing`,
    'ops.grp.driver': (v) => `${v.n} ${pl(v.n, 'order', 'orders')} · ${v.d} delivered · ${v.r} ready/on the way`,
    'ops.nLunch': '{n} lunch', 'ops.nDinner': '{n} dinner', 'ops.nActive': (v) => `${v.n} active ${pl(v.n, 'order', 'orders')}`, 'ops.nNoDriver': '{n} without a driver',
    'ops.nOrders': (v) => `${v.n} ${pl(v.n, 'order', 'orders')}`,
    'ops.prevDay': 'Previous day', 'ops.nextDay': 'Next day', 'ops.searchPh': 'Search: order no., customer, meal',
    'ops.g.list': 'List', 'ops.g.rest': 'By restaurant', 'ops.g.driver': 'By driver',
    'ops.selected': '{n} selected', 'ops.pickDriver': 'Choose a driver…', 'ops.assignBtn': 'Assign', 'ops.changeStatus': 'Change status…', 'ops.clearSel': 'Clear selection',
    'ops.t.assigned': (v) => `${v.n} ${pl(v.n, 'order', 'orders')} assigned to drivers`, 'ops.t.allAssigned': 'All orders already have a driver', 'ops.t.byZone': "Based on each driver's zone",
    'ops.t.assignedTo': 'Assigned to {name}', 'ops.t.driverRemoved': 'Driver removed',
    'ops.failReason': 'Why did the delivery fail?', 'ops.failReasonDef': 'Customer not at home', 'ops.cancelConfirm': (v) => `Cancel ${v.n} ${pl(v.n, 'order', 'orders')}?`,
    'ops.t.updated': '{what} updated', 'ops.t.pickDriverFirst': 'Choose a driver first', 'ops.t.bulkAssigned': (v) => `${v.n} ${pl(v.n, 'order', 'orders')} assigned`, 'ops.t.pickStatusFirst': 'Choose a status first',

    // ---- reviews
    'rev.sub': 'All orders rated by customers — {n} ratings, {c} with a comment', 'rev.avgAll': 'Average of all ratings', 'rev.byRest': 'By restaurant',
    'rev.nRatings': (v) => `${v.n} ${pl(v.n, 'rating', 'ratings')}`, 'rev.allRatings': 'All ratings', 'rev.low': '⚠ Low (1–2)', 'rev.nStars': (v) => `${v.n} ${pl(v.n, 'star', 'stars')}`, 'rev.noMatch': 'No matching reviews',
    'rev.th.date': 'Date', 'rev.th.rating': 'Rating', 'rev.th.comment': 'Comment', 'rev.th.meal': 'Meal', 'rev.th.rest': 'Restaurant', 'rev.th.customer': 'Customer', 'rev.th.order': 'Order',

    // ---- subscriptions
    'sub.searchPh': 'Search by code or customer name', 'sub.noMatch': 'No matching subscriptions', 'sub.postponedN': 'Postponed',
    'sub.th.code': 'Code', 'sub.th.customer': 'Customer', 'sub.th.plan': 'Plan', 'sub.th.days': 'Days', 'sub.th.meals': 'Meals', 'sub.th.start': 'Start',
    'sub.th.progress': 'Progress', 'sub.th.status': 'Status', 'sub.th.paid': 'Paid', 'sub.th.payment': 'Payment',
    'sub.hasAllergen': 'Contains an allergen', 'sub.notPicked': 'Not picked yet', 'sub.changeMeal': 'Change meal…', 'sub.pickMeal': 'Choose a meal…',
    'sub.postponed': 'Postponed', 'sub.movedFrom': 'Moved from', 'sub.locked': 'Locked', 'sub.postponeDay': 'Postpone day',
    'sub.duration': 'Duration', 'sub.address': 'Address', 'sub.progLine': '{d} days · {m} meals · postponements {p}',
    'sub.basePrice': (v) => `Base price (${v.n} meals)`, 'sub.durDisc': 'Duration discount', 'sub.optDisc': 'Lunch + dinner discount', 'sub.deliveryFee': 'Delivery fee',
    'sub.promo': 'Promo code', 'sub.totalPaid': 'Total paid', 'sub.vatLine': 'Incl. {v} VAT · {p} per meal', 'sub.refund': 'Refund',
    'sub.notes': 'Notes', 'sub.custNote': 'Customer note', 'sub.notePh': 'Add an internal note…', 'sub.schedule': 'Daily schedule',
    'sub.changeUntil': 'Changes allowed until {h} the day before', 'sub.changeUntilMidnight': 'Changes allowed until midnight (00:00) before the delivery day',
    'sub.cancel': 'Cancel subscription', 'sub.refundDemo': 'Refund (demo)',
    'sub.t.cantChange': "Can't change this", 'sub.t.dayLocked': 'This day is locked (cutoff passed)', 'sub.t.mealChanged': 'Meal changed',
    'sub.postponeConfirm': 'Postpone {d}? A replacement day will be added at the end of the subscription.', 'sub.t.postponed': 'Day postponed', 'sub.t.newDay': 'Replacement day: {d}',
    'sub.t.postponeFail': "Couldn't postpone", 'sub.t.locked': 'The day is locked', 'sub.t.limit': 'Postponement limit reached', 'sub.t.noDay': 'Day not found',
    'sub.t.noteFirst': 'Write the note first', 'sub.t.noteAdded': 'Note added',
    'sub.cancelConfirm': 'Cancel subscription {code}? All upcoming unlocked orders will be cancelled.', 'sub.t.cancelled': 'Subscription cancelled',
    'sub.t.nCancelled': (v) => `${v.n} upcoming ${pl(v.n, 'order', 'orders')} cancelled`,
    'sub.refundTitle': 'Refund', 'sub.refundDo': 'Issue refund', 'sub.refundNote': 'Demo only — no real money is moved. Suggested amount = unprepared meals × price per meal.',
    'sub.amount': 'Amount (€)', 'sub.reason': 'Reason', 'sub.refundMax': 'Maximum: {m} · Remaining meals value: {r}',
    'sub.rr.cancel': 'Subscription cancelled', 'sub.rr.missing': 'Meal not delivered', 'sub.rr.quality': 'Meal quality', 'sub.rr.goodwill': 'Goodwill', 'sub.rr.other': 'Other',
    'sub.t.badAmount': 'Invalid amount', 'sub.t.refunded': 'Refund issued',

    // ---- customers
    'cust.sub': '{n} customers · {a} with an active subscription', 'cust.searchPh': 'Search by name, phone or email', 'cust.noMatch': 'No matching customers',
    'cust.th.customer': 'Customer', 'cust.th.phone': 'Phone', 'cust.th.city': 'City', 'cust.th.allergies': 'Allergies', 'cust.th.subs': 'Subscriptions',
    'cust.th.delivered': 'Meals delivered', 'cust.th.spent': 'Total spent', 'cust.th.joined': 'Joined',
    'cust.activeSubs': 'Active subscriptions', 'cust.avgRating': 'Average rating given', 'cust.goal': 'Goal', 'cust.lang': 'Language',
    'cust.addresses': 'Addresses', 'cust.noAddr': 'No addresses', 'cust.allergiesEdit': 'Allergies (click to edit)', 'cust.dislikes': 'Dislikes',
    'cust.noSubs': 'No subscriptions', 'cust.upcoming': 'Upcoming orders', 'cust.past': 'Past orders & ratings', 'cust.noOrders': 'No orders yet',
    'cust.notify': 'Send a notification to this customer', 'cust.notifyTitlePh': 'Title — e.g. A gift for you 🎁', 'cust.notifyBodyPh': 'Message',
    'cust.sendToApp': 'Send to app', 'cust.lastNotifs': "Customer's latest notifications",
    'cust.t.allergies': 'Allergies updated', 'cust.t.titleFirst': 'Enter a notification title', 'cust.t.sent': 'Notification sent',

    // ---- drivers
    'drv.sub': '{n} online of {of}', 'drv.assignToday': "Assign today's orders", 'drv.new': 'New driver',
    'drv.th.driver': 'Driver', 'drv.th.vehicle': 'Vehicle', 'drv.th.zone': 'Zone', 'drv.th.online': 'Online', 'drv.th.assigned': 'Today: assigned',
    'drv.th.delivered': 'Delivered', 'drv.th.live': 'In progress', 'drv.orders': 'Orders',
    'drv.t.online': 'Driver is online', 'drv.t.offline': 'Driver is offline', 'drv.editTitle': 'Edit driver',
    'drv.f.name': 'Name', 'drv.f.plate': 'Licence plate', 'drv.f.pin': 'Login PIN (4 digits)', 'drv.f.onlineNow': 'Online now',
    'drv.delete': 'Delete driver', 'drv.deleteConfirm': 'Delete {name}? They will be unassigned from all undelivered orders.', 'drv.t.deleted': 'Driver deleted',
    'drv.t.nameReq': "Enter the driver's name", 'drv.t.pinBad': 'PIN must be 4–6 digits', 'drv.t.saved': 'Driver saved', 'drv.t.added': 'Driver added',

    // ---- restaurants
    'rest.sub': "Delyvo has no kitchen — every meal comes from partner restaurants. Customers never see restaurant names.", 'rest.new': 'New restaurant', 'rest.newTitle': 'New partner restaurant',
    'rest.kpi.active': 'Active restaurants', 'rest.kpi.delivered': 'Meals delivered this month', 'rest.kpi.payout': 'Restaurant payouts this month', 'rest.kpi.payoutSub': 'Meals × cost per meal',
    'rest.offNote': 'Paused — meals hidden from customers', 'rest.cost': 'Cost per meal', 'rest.todayOrders': "Today's orders",
    'rest.monthDelivered': 'Delivered this month', 'rest.monthPayout': 'Payout this month',
    'rest.pauseConfirm': 'Pause {name}? Its meals will be hidden from the customer app immediately.', 'rest.pauseUpcoming': (v) => `⚠ It has ${v.n} upcoming ${pl(v.n, 'order', 'orders')} — review them under Subscriptions.`,
    'rest.t.activated': 'Restaurant activated', 'rest.t.paused': 'Restaurant paused',
    'rest.f.name': 'Restaurant name', 'rest.f.cuisine': 'Cuisine', 'rest.f.cuisinePh': 'Arabic / Turkish / Healthy…', 'rest.f.contact': 'Contact person',
    'rest.f.cost': 'Delyvo pays per meal (€)', 'rest.f.pin': 'Restaurant panel PIN', 'rest.f.color': 'Accent colour', 'rest.f.active': 'Active (meals visible to customers)',
    'rest.t.nameReq': 'Enter the restaurant name', 'rest.t.costBad': 'Invalid cost per meal', 'rest.t.added': 'Restaurant added', 'rest.t.saved': 'Restaurant saved',

    // ---- meals
    'meal.catalog': 'Meal catalogue', 'meal.sub': '{n} active meals of {of} · the supplying restaurant is visible to admins only', 'meal.new': 'New meal',
    'meal.searchPh': 'Search by meal name (ar / nl / en)', 'meal.f.on': 'Active', 'meal.f.off': 'Inactive', 'meal.nMeals': (v) => `${v.n} ${pl(v.n, 'meal', 'meals')}`,
    'meal.th.supplier': 'Supplier', 'meal.th.plans': 'Plans', 'meal.th.slot': 'Slot', 'meal.th.nutrition': 'Nutrition',
    'meal.th.allergens': 'Allergens', 'meal.th.margin': 'Margin / meal', 'meal.th.active': 'Active',
    'meal.restCost': 'restaurant cost', 'meal.restPaused': 'Restaurant paused', 'meal.cost': 'Cost', 'meal.none': 'None', 'meal.noMatch': 'No matching meals',
    'meal.t.visible': 'Meal visible to customers', 'meal.t.hidden': 'Meal hidden',
    'img.label': 'Image URL or pick from the library', 'img.ph': '../assets/img/meals/…jpg or https://…',
    'meal.f.name': 'Meal name', 'meal.f.desc': 'Description', 'meal.f.ingr': 'Ingredients', 'meal.f.supplier': 'Supplying restaurant (internal — not shown to customers)',
    'meal.f.margin': 'Margin per meal', 'meal.f.kcal': 'Calories (kcal)', 'meal.f.protein': 'Protein (g)', 'meal.f.carbs': 'Carbs (g)', 'meal.f.fat': 'Fat (g)',
    'meal.f.allergens': 'Allergens (the 14 EU regulated allergens)', 'meal.f.tags': 'Tags', 'meal.f.active': 'Active — visible to customers in the selected plans',
    'meal.t.pickPlan': 'Select at least one plan', 'meal.t.nameArReq': 'Enter the meal name in Arabic', 'meal.t.pickSlot': 'Select lunch or dinner',
    'meal.t.pickImg': 'Choose an image for the meal', 'meal.t.added': 'Meal added', 'meal.t.saved': 'Meal saved',

    // ---- plans
    'plan.sub': 'Changes here apply instantly in the customer app and in checkout pricing', 'plan.perMealPrice': '{p} per meal', 'plan.meal': 'meal', 'plan.save': 'save {a}',
    'plan.nActiveSubs': (v) => `${v.n} active ${pl(v.n, 'subscription', 'subscriptions')}`, 'plan.f.price': 'Price per meal (€)', 'plan.f.margin': 'Estimated margin', 'plan.avgCost': 'avg. restaurant cost {a}',
    'plan.f.name': 'Name', 'plan.f.desc': 'Description', 'plan.f.icon': 'Icon', 'plan.f.kcal': 'Calories', 'plan.f.color': 'Colour',
    'plan.durDiscounts': 'Duration discounts', 'plan.durDiscountsSub': 'Applied to the base price', 'plan.discountPct': 'Discount %', 'plan.badgeAr': 'Badge (Arabic)',
    'plan.mealOptions': 'Meal options', 'plan.mealOptionsSub': 'Extra discount when lunch + dinner is chosen', 'plan.option': 'Option', 'plan.mealsPerDay': 'Meals per day',
    'plan.vatNote': '{v} VAT included in prices · delivery fees per zone are set in Settings',
    'plan.preview': 'Live price preview', 'plan.previewSub': 'Calculated with DV.price for Rotterdam without a promo code — exactly what customers see at checkout',
    'plan.t.updated': 'Prices updated in the customer app',

    // ---- marketing
    'mkt.sub': 'Banners appear on the customer app home screen instantly', 'mkt.banners': 'Home screen banners', 'mkt.bannersSub': '{n} of {of} visible · reorder with the arrows',
    'mkt.newBanner': 'New banner', 'mkt.editBanner': 'Edit banner', 'mkt.moveUp': 'Move up', 'mkt.moveDown': 'Move down', 'mkt.noBanners': 'No banners',
    'mkt.promos': 'Promo codes', 'mkt.promosSub': 'Applied at checkout in the customer app', 'mkt.newPromo': 'New code', 'mkt.newPromoTitle': 'New promo code',
    'mkt.th.type': 'Type', 'mkt.th.value': 'Value', 'mkt.th.uses': 'Uses', 'mkt.th.note': 'Note', 'mkt.th.active': 'Active',
    'mkt.percent': 'Percentage', 'mkt.fixed': 'Fixed amount', 'mkt.noPromos': 'No promo codes', 'mkt.usedN': (v) => `Used ${v.n} ${pl(v.n, 'time', 'times')}`,
    'mkt.broadcast': 'Broadcast notification', 'mkt.broadcastSub': "Delivered instantly to the selected app's inbox",
    'mkt.allCustomers': 'All customers', 'mkt.allDrivers': 'All drivers', 'mkt.allRestaurants': 'All restaurants',
    'mkt.f.title': 'Title', 'mkt.f.body': 'Message', 'mkt.f.subtitle': 'Subtitle', 'mkt.f.bg': 'Background colour', 'mkt.f.visible': 'Visible in the app', 'mkt.f.internalNote': 'Internal note',
    'mkt.langNote': "Customers see the version in their app's language. Empty fields fall back to the Arabic text.",
    'mkt.sendTo.customers': (v) => `Send to ${v.n} ${pl(v.n, 'customer', 'customers')}`, 'mkt.sendTo.drivers': (v) => `Send to ${v.n} ${pl(v.n, 'driver', 'drivers')}`,
    'mkt.sendTo.restaurants': (v) => `Send to ${v.n} ${pl(v.n, 'restaurant', 'restaurants')}`,
    'mkt.previewTitle': 'Notification title', 'mkt.previewBody': 'Your message appears here', 'mkt.preview': 'Preview', 'mkt.livePreview': 'Live preview',
    'mkt.bannerTitlePh': 'Banner title', 'mkt.deleteBanner': 'Delete banner', 'mkt.deleteBannerConfirm': 'Delete this banner?', 'mkt.deletePromo': 'Delete code',
    'mkt.sendConfirm': 'Send the notification now?',
    'mkt.t.titleArReq': 'Enter a notification title', 'mkt.t.sent': 'Sent to {n}', 'mkt.t.bannerOn': 'Banner is now visible', 'mkt.t.bannerOff': 'Banner hidden',
    'mkt.t.bannerDeleted': 'Banner deleted', 'mkt.t.bannerTitleReq': 'Enter the banner title (Arabic)', 'mkt.t.bannerAdded': 'Banner added', 'mkt.t.bannerSaved': 'Banner saved',
    'mkt.t.promoOn': 'Code activated', 'mkt.t.promoOff': 'Code deactivated', 'mkt.t.promoDeleted': 'Code deleted', 'mkt.t.codeBad': 'Code: 3–20 Latin letters/digits',
    'mkt.t.codeExists': 'This code already exists', 'mkt.t.promoAdded': 'Code added', 'mkt.t.promoSaved': 'Code saved',

    // ---- settings
    'set.sub': 'Saved automatically whenever a field changes, and applied across all apps', 'set.rules': 'Ordering & change rules', 'set.rulesSub': 'When customers can change or postpone',
    'set.cutoff': 'Change cutoff', 'set.minLead': 'Minimum lead time (days)', 'set.maxPostpones': 'Maximum postponements',
    'set.cutoffEx': "Example: changes to Thursday's meal are allowed until {h} on Wednesday.",
    'set.cutoffEx24': "Example: changes to Thursday's meal are allowed until midnight (00:00) between Wednesday and Thursday.",
    'set.cutoffExTail': 'After that, the chef picks automatically for days without a selection.',
    'set.weekdays': 'Delivery days', 'set.finance': 'Finance & support', 'set.vat': 'VAT rate (BTW)', 'set.whatsapp': 'Support WhatsApp',
    'set.demo': 'Demo data', 'set.demoSub': 'Wipes all changes and orders and restores the original data in every app.',
    'set.windows': 'Delivery windows', 'set.windowsSub': 'The text customers and drivers see', 'set.id': 'ID',
    'set.zones': 'Delivery zones & fees', 'set.zonesSub': 'Fee per delivery day — added to the subscription price', 'set.th.fee': 'Delivery fee / day', 'set.th.customers': 'Customers',
    'set.newCity': 'New city', 'set.addZone': 'Add zone',
    'set.t.saved': 'Setting saved', 'set.t.oneDay': 'Select at least one day', 'set.t.weekdays': 'Delivery days updated', 'set.t.window': 'Delivery window saved',
    'set.t.fee': 'Fee saved', 'set.zoneDelConfirm': 'Delete zone {city}?', 'set.t.cityReq': 'Enter the city name', 'set.t.cityExists': 'This city already exists', 'set.t.zoneAdded': 'Zone added'
  };

  const DICT = { ar, en };
  let lang = 'ar';
  try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch (e) {}

  function tIn(lng, key, vars) {
    const d = DICT[lng] || en;
    const v = d[key] !== undefined ? d[key] : ar[key] !== undefined ? ar[key] : key;
    if (typeof v === 'function') return v(vars || {});
    return vars ? String(v).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : v;
  }
  const t = (key, vars) => tIn(lang, key, vars);

  function applyDir() {
    const h = document.documentElement;
    h.setAttribute('lang', lang); h.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
  /** Translate static markup: data-i18n (text), data-i18n-html, data-i18n-ph, data-i18n-title, data-i18n-aria. */
  function applyStatic(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.getAttribute('data-i18n-title'))); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    root.querySelectorAll('[data-lang-btn]').forEach((b) => { const on = b.getAttribute('data-lang') === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    document.title = t('app.docTitle');
  }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'ar';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyDir(); applyStatic();
  }
  applyDir();

  window.I18N = { t, tIn, setLang, applyStatic, dict: DICT, get lang() { return lang; } };
})();

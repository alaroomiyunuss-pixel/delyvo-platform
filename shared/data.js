/* Delyvo — seed catalogue (demo data, editable from the admin panel).
   Restaurants are partners; customers never see restaurant names. */
(function () {
  const IMG = (f) => '../assets/img/meals/' + f + '.jpg';

  const ALLERGENS = {
    gluten:    { ar: 'غلوتين',        nl: 'Gluten',         en: 'Gluten',      icon: '🌾' },
    milk:      { ar: 'حليب/ألبان',    nl: 'Melk',           en: 'Milk',        icon: '🥛' },
    eggs:      { ar: 'بيض',           nl: 'Ei',             en: 'Eggs',        icon: '🥚' },
    fish:      { ar: 'سمك',           nl: 'Vis',            en: 'Fish',        icon: '🐟' },
    crustaceans:{ ar: 'قشريات',       nl: 'Schaaldieren',   en: 'Crustaceans', icon: '🦐' },
    peanuts:   { ar: 'فول سوداني',    nl: 'Pinda',          en: 'Peanuts',     icon: '🥜' },
    nuts:      { ar: 'مكسرات',        nl: 'Noten',          en: 'Tree nuts',   icon: '🌰' },
    soy:       { ar: 'صويا',          nl: 'Soja',           en: 'Soy',         icon: '🫘' },
    sesame:    { ar: 'سمسم',          nl: 'Sesam',          en: 'Sesame',      icon: '⚪' },
    mustard:   { ar: 'خردل',          nl: 'Mosterd',        en: 'Mustard',     icon: '🟡' },
    celery:    { ar: 'كرفس',          nl: 'Selderij',       en: 'Celery',      icon: '🥬' },
    sulphites: { ar: 'كبريتات',       nl: 'Sulfiet',        en: 'Sulphites',   icon: '🍷' },
    lupin:     { ar: 'ترمس',          nl: 'Lupine',         en: 'Lupin',       icon: '🌼' },
    molluscs:  { ar: 'رخويات',        nl: 'Weekdieren',     en: 'Molluscs',    icon: '🐚' }
  };

  const TAGS = {
    'high-protein': { ar: 'بروتين عالي', nl: 'Eiwitrijk', en: 'High protein' },
    'spicy':        { ar: 'حار',         nl: 'Pittig',    en: 'Spicy' },
    'low-carb':     { ar: 'كارب منخفض',  nl: 'Koolhydraatarm', en: 'Low carb' },
    'new':          { ar: 'جديد',        nl: 'Nieuw',     en: 'New' },
    'popular':      { ar: 'الأكثر طلباً', nl: 'Populair', en: 'Popular' },
    'vegetarian':   { ar: 'نباتي',       nl: 'Vegetarisch', en: 'Vegetarian' },
    'vegan':        { ar: 'نباتي صرف',   nl: 'Vegan',     en: 'Vegan' },
    'halal':        { ar: 'حلال',        nl: 'Halal',     en: 'Halal' }
  };

  const restaurants = [
    { id: 'r1', name: 'Mandi House',   cuisine: { ar: 'عربي / يمني', nl: 'Arabisch / Jemenitisch', en: 'Arabic / Yemeni' },  city: 'Rotterdam', address: 'Nieuwe Binnenweg 112, Rotterdam', phone: '+31 10 222 1100', contact: 'Abdullah', pin: '1234', active: true, costPerMeal: 6.5, color: '#C2410C' },
    { id: 'r2', name: 'Istanbul Grill', cuisine: { ar: 'تركي', nl: 'Turks', en: 'Turkish' },        city: 'Rotterdam', address: 'West-Kruiskade 40, Rotterdam',   phone: '+31 10 333 4400', contact: 'Murat',    pin: '1234', active: true, costPerMeal: 6.0, color: '#B91C1C' },
    { id: 'r3', name: 'Green Bowl Kitchen', cuisine: { ar: 'صحي / بوكي', nl: 'Gezond / poké', en: 'Healthy / poké' }, city: 'Den Haag', address: 'Grote Marktstraat 9, Den Haag', phone: '+31 70 555 1200', contact: 'Sanne',  pin: '1234', active: true, costPerMeal: 7.2, color: '#15803D' },
    { id: 'r4', name: 'Spice Route',   cuisine: { ar: 'هندي / سورينامي', nl: 'Indiaas / Surinaams', en: 'Indian / Surinamese' }, city: 'Delft', address: 'Oude Delft 77, Delft',          phone: '+31 15 212 8800', contact: 'Ravi',     pin: '1234', active: true, costPerMeal: 6.4, color: '#A16207' },
    { id: 'r5', name: 'Plant Power',   cuisine: { ar: 'نباتي', nl: 'Vegan', en: 'Vegan' },       city: 'Rotterdam', address: 'Witte de Withstraat 21, Rotterdam', phone: '+31 10 777 9000', contact: 'Iris', pin: '1234', active: true, costPerMeal: 6.2, color: '#4D7C0F' }
  ];

  // m(id, restaurant, img, names, desc, plans, slots, kcal, p, c, f, allergens, tags, ingredients)
  const M = (id, r, img, name, desc, plans, slots, kcal, p, c, f, allergens, tags, ingr) =>
    ({ id, restaurantId: r, img: IMG(img), name, desc, plans, slots, kcal, protein: p, carbs: c, fat: f, allergens, tags, ingredients: ingr, active: true, rating: 0, ratingCount: 0, shelfDays: 2, reheat: { ar: 'سخّن في الميكروويف 2–3 دقائق', nl: 'Verwarm 2–3 min in de magnetron', en: 'Microwave 2–3 min' } });

  const meals = [
    M('m01','r1','kip-mandi',        { ar:'مندي دجاج', nl:'Kip mandi', en:'Chicken mandi' }, { ar:'دجاج مدخّن على الطريقة اليمنية مع أرز بسمتي بالبهارات وصلصة الدقوس', nl:'Gerookte kip op Jemenitische wijze met gekruide basmati en daqqus-saus', en:'Yemeni-style smoked chicken, spiced basmati and daqqus sauce' }, ['varied'], ['lunch','dinner'], 720, 46, 78, 22, [], ['popular','halal','high-protein'], { ar:'دجاج، أرز بسمتي، بهارات مندي، طماطم، ثوم، فلفل', nl:'Kip, basmati, mandi-kruiden, tomaat, knoflook, peper', en:'Chicken, basmati, mandi spices, tomato, garlic, chili' }),
    M('m02','r1','kip-haneed',       { ar:'حنيذ دجاج', nl:'Kip haneeth', en:'Chicken haneeth' }, { ar:'دجاج مطهو ببطء مع أرز بالزعفران ومكسرات محمصة', nl:'Langzaam gegaarde kip met saffraanrijst en geroosterde noten', en:'Slow-cooked chicken with saffron rice and toasted nuts' }, ['varied'], ['lunch','dinner'], 760, 44, 80, 26, ['nuts'], ['halal'], { ar:'دجاج، أرز، زعفران، لوز، زبيب', nl:'Kip, rijst, saffraan, amandel, rozijnen', en:'Chicken, rice, saffron, almonds, raisins' }),
    M('m03','r1','shawarma-arabisch',{ ar:'شاورما عربي', nl:'Arabische shoarma', en:'Arabic shawarma' }, { ar:'شاورما دجاج بخبز صاج مع ثومية ومخلل وبطاطا', nl:'Kipshoarma in saj-brood met toum, zuur en friet', en:'Chicken shawarma in saj bread with toum, pickles and fries' }, ['varied'], ['lunch','dinner'], 810, 40, 82, 34, ['gluten','eggs'], ['popular','halal'], { ar:'دجاج، خبز صاج، ثوم، مخلل خيار، بطاطا', nl:'Kip, saj-brood, knoflook, augurk, friet', en:'Chicken, saj bread, garlic, pickles, fries' }),
    M('m04','r1','shish-taouk',      { ar:'شيش طاووق', nl:'Shish taouk', en:'Shish taouk' }, { ar:'أسياخ دجاج متبلة بالزبادي والليمون مع برغل وسلطة', nl:'Kipspiesen gemarineerd in yoghurt en citroen met bulgur en salade', en:'Yogurt-lemon chicken skewers with bulgur and salad' }, ['varied','healthy'], ['lunch','dinner'], 560, 48, 52, 14, ['milk','gluten'], ['high-protein','halal'], { ar:'صدر دجاج، زبادي، ليمون، برغل، خضار', nl:'Kipfilet, yoghurt, citroen, bulgur, groenten', en:'Chicken breast, yogurt, lemon, bulgur, vegetables' }),
    M('m05','r1','broodje-shoarma',  { ar:'ساندويتش شاورما', nl:'Broodje shoarma', en:'Shawarma sandwich' }, { ar:'خبز محمّص محشو بشاورما لحم مع صلصة الطحينة', nl:'Afgebakken broodje met vleesshoarma en tahinesaus', en:'Toasted bun with beef shawarma and tahini sauce' }, ['varied'], ['lunch'], 690, 36, 70, 28, ['gluten','sesame'], ['halal'], { ar:'لحم، خبز، طحينة، بصل، بقدونس', nl:'Rundvlees, brood, tahin, ui, peterselie', en:'Beef, bread, tahini, onion, parsley' }),

    M('m06','r2','kapsalon-doner',   { ar:'كابسالون دونر', nl:'Kapsalon döner', en:'Kapsalon döner' }, { ar:'بطاطا مقرمشة مع دونر وجبن ذائب وسلطة', nl:'Friet met döner, gesmolten kaas en salade', en:'Fries topped with döner, melted cheese and salad' }, ['varied'], ['lunch','dinner'], 980, 44, 72, 56, ['milk'], ['popular','halal'], { ar:'دونر، بطاطا، جبن غودا، خس، صلصة ثوم', nl:'Döner, friet, goudse kaas, sla, knoflooksaus', en:'Döner, fries, gouda, lettuce, garlic sauce' }),
    M('m07','r2','kapsalon-kipshoarma',{ ar:'كابسالون شاورما دجاج', nl:'Kapsalon kipshoarma', en:'Chicken kapsalon' }, { ar:'بطاطا مع شاورما دجاج وجبن وصلصة سامبال', nl:'Friet met kipshoarma, kaas en sambalsaus', en:'Fries with chicken shawarma, cheese and sambal' }, ['varied'], ['dinner'], 940, 46, 74, 50, ['milk'], ['spicy','halal'], { ar:'دجاج، بطاطا، جبن، سامبال', nl:'Kip, friet, kaas, sambal', en:'Chicken, fries, cheese, sambal' }),
    M('m08','r2','turkse-pizza-doner',{ ar:'بيتزا تركية دونر', nl:'Turkse pizza döner', en:'Turkish pizza döner' }, { ar:'لحمجون ملفوف بالدونر والخضار الطازجة', nl:'Lahmacun gerold met döner en verse groenten', en:'Lahmacun rolled with döner and fresh vegetables' }, ['varied'], ['lunch'], 720, 38, 76, 26, ['gluten'], ['halal'], { ar:'عجين، لحم مفروم، دونر، خس، طماطم', nl:'Deeg, gehakt, döner, sla, tomaat', en:'Dough, minced meat, döner, lettuce, tomato' }),
    M('m09','r2','kapsalon-hete-kip',{ ar:'كابسالون دجاج حار', nl:'Kapsalon hete kip', en:'Hot chicken kapsalon' }, { ar:'قطع دجاج حارة على بطاطا مع جبن وهالبينو', nl:'Pittige kip op friet met kaas en jalapeño', en:'Hot chicken on fries with cheese and jalapeño' }, ['varied'], ['dinner'], 990, 48, 70, 58, ['milk'], ['spicy','halal'], { ar:'دجاج، بطاطا، جبن، هالبينو', nl:'Kip, friet, kaas, jalapeño', en:'Chicken, fries, cheese, jalapeño' }),
    M('m10','r2','durum-falafel',    { ar:'دُرُم فلافل', nl:'Dürüm falafel', en:'Falafel dürüm' }, { ar:'فلافل مقرمشة ملفوفة بخبز رقيق مع حمص وخضار', nl:'Knapperige falafel in dun brood met hummus en groenten', en:'Crispy falafel wrap with hummus and vegetables' }, ['varied','vegan'], ['lunch','dinner'], 640, 20, 84, 24, ['gluten','sesame'], ['vegan','popular'], { ar:'حمص، فلافل، خبز، طحينة، خيار، طماطم', nl:'Kikkererwten, falafel, brood, tahin, komkommer, tomaat', en:'Chickpeas, falafel, bread, tahini, cucumber, tomato' }),
    M('m11','r2','turkse-pizza-falafel',{ ar:'بيتزا تركية فلافل', nl:'Turkse pizza falafel', en:'Turkish pizza falafel' }, { ar:'لحمجون نباتي مع فلافل وصلصة طحينة', nl:'Vegetarische lahmacun met falafel en tahinesaus', en:'Veggie lahmacun with falafel and tahini' }, ['varied','vegan'], ['lunch'], 610, 18, 86, 20, ['gluten','sesame'], ['vegan'], { ar:'عجين، فلافل، طحينة، خضار', nl:'Deeg, falafel, tahin, groenten', en:'Dough, falafel, tahini, vegetables' }),
    M('m12','r2','rock-n-chicken',   { ar:'روك آند تشيكن', nl:"Rock 'n chicken", en:"Rock 'n chicken" }, { ar:'دجاج مقرمش مع أرز وصلصة باربكيو مدخنة', nl:'Krokante kip met rijst en smoky bbq-saus', en:'Crispy chicken with rice and smoky BBQ sauce' }, ['varied'], ['lunch','dinner'], 830, 42, 88, 30, ['gluten','eggs','mustard'], ['new','halal'], { ar:'دجاج، بقسماط، أرز، صلصة باربكيو', nl:'Kip, paneermeel, rijst, bbq-saus', en:'Chicken, breadcrumbs, rice, BBQ sauce' }),
    M('m13','r2','crispy-maaltijd',  { ar:'وجبة كريسبي', nl:'Crispy maaltijd', en:'Crispy meal' }, { ar:'قطع دجاج كريسبي مع سلطة كول سلو وبطاطا ودجز', nl:'Crispy kip met koolsla en aardappelpartjes', en:'Crispy chicken with coleslaw and potato wedges' }, ['varied'], ['dinner'], 870, 40, 84, 38, ['gluten','eggs','milk'], ['halal'], { ar:'دجاج، ملفوف، مايونيز، بطاطا', nl:'Kip, kool, mayonaise, aardappel', en:'Chicken, cabbage, mayo, potato' }),

    M('m14','r3','so-salmon-bowl',   { ar:'بول السلمون', nl:'So salmon bowl', en:'So salmon bowl' }, { ar:'سلمون مشوي مع أرز سوشي وإدامامي وأفوكادو وصوص سمسم', nl:'Gegrilde zalm met sushirijst, edamame, avocado en sesamdressing', en:'Grilled salmon, sushi rice, edamame, avocado, sesame dressing' }, ['varied','healthy'], ['lunch','dinner'], 590, 38, 58, 20, ['fish','soy','sesame'], ['high-protein','popular'], { ar:'سلمون، أرز، إدامامي، أفوكادو، سمسم، صويا', nl:'Zalm, rijst, edamame, avocado, sesam, soja', en:'Salmon, rice, edamame, avocado, sesame, soy' }),
    M('m15','r3','spicy-tuna',       { ar:'بول تونة حارة', nl:'Spicy tuna bowl', en:'Spicy tuna bowl' }, { ar:'تونة مع صلصة سريراتشا ومانغو وخيار ومكرونة الأعشاب البحرية', nl:'Tonijn met sriracha, mango, komkommer en zeewiersalade', en:'Tuna with sriracha, mango, cucumber and seaweed salad' }, ['varied','healthy'], ['lunch','dinner'], 540, 36, 60, 14, ['fish','soy','eggs'], ['spicy','high-protein'], { ar:'تونة، أرز، مانغو، خيار، سريراتشا', nl:'Tonijn, rijst, mango, komkommer, sriracha', en:'Tuna, rice, mango, cucumber, sriracha' }),
    M('m16','r3','truly-tuna',       { ar:'بول تونة كلاسيك', nl:'Truly tuna bowl', en:'Truly tuna bowl' }, { ar:'تونة طازجة مع كينوا وخضار مقرمشة وصوص ليمون', nl:'Verse tonijn met quinoa, knapperige groenten en citroendressing', en:'Fresh tuna, quinoa, crunchy greens and lemon dressing' }, ['healthy'], ['lunch'], 480, 34, 44, 16, ['fish'], ['low-carb','high-protein'], { ar:'تونة، كينوا، خيار، فجل، ليمون', nl:'Tonijn, quinoa, komkommer, radijs, citroen', en:'Tuna, quinoa, cucumber, radish, lemon' }),
    M('m17','r3','poke-zalm',        { ar:'بوكي سلمون', nl:'Poké zalm', en:'Salmon poké' }, { ar:'سلمون نيّئ متبّل مع أرز بني وملفوف أحمر وجزر', nl:'Gemarineerde zalm met zilvervliesrijst, rode kool en wortel', en:'Marinated salmon, brown rice, red cabbage and carrot' }, ['healthy'], ['lunch','dinner'], 520, 32, 54, 18, ['fish','soy','sesame'], ['new'], { ar:'سلمون، أرز بني، ملفوف، جزر، صويا', nl:'Zalm, zilvervliesrijst, kool, wortel, soja', en:'Salmon, brown rice, cabbage, carrot, soy' }),
    M('m18','r3','teriyaki-chicks',  { ar:'دجاج ترياكي', nl:'Teriyaki chicken', en:'Teriyaki chicken' }, { ar:'دجاج بصوص الترياكي مع أرز ياسمين وبروكلي', nl:'Kip in teriyakisaus met jasmijnrijst en broccoli', en:'Teriyaki chicken with jasmine rice and broccoli' }, ['varied','healthy'], ['lunch','dinner'], 610, 44, 66, 14, ['soy','sesame','gluten'], ['high-protein','halal'], { ar:'دجاج، صوص ترياكي، أرز، بروكلي', nl:'Kip, teriyaki, rijst, broccoli', en:'Chicken, teriyaki, rice, broccoli' }),

    M('m19','r4','pompoen-kerrie-kip',{ ar:'كاري دجاج بالقرع', nl:'Pompoen-kerrie kip', en:'Pumpkin chicken curry' }, { ar:'كاري دجاج كريمي بالقرع وحليب جوز الهند مع أرز', nl:'Romige kip-kerrie met pompoen en kokosmelk, met rijst', en:'Creamy chicken curry with pumpkin and coconut, with rice' }, ['varied','healthy'], ['lunch','dinner'], 630, 40, 64, 20, ['celery'], ['halal'], { ar:'دجاج، قرع، حليب جوز هند، كاري، أرز', nl:'Kip, pompoen, kokosmelk, kerrie, rijst', en:'Chicken, pumpkin, coconut milk, curry, rice' }),
    M('m20','r4','roti-kerrie-kipfilet',{ ar:'روتي كاري دجاج', nl:'Roti kerrie kipfilet', en:'Roti chicken curry' }, { ar:'روتي سورينامي مع كاري دجاج وبطاطا وفاصوليا طويلة', nl:'Surinaamse roti met kipkerrie, aardappel en kousenband', en:'Surinamese roti with chicken curry, potato and long beans' }, ['varied'], ['lunch','dinner'], 850, 42, 92, 30, ['gluten','eggs'], ['popular','halal'], { ar:'روتي، دجاج، بطاطا، فاصوليا، بيض', nl:'Roti, kip, aardappel, kousenband, ei', en:'Roti, chicken, potato, long beans, egg' }),
    M('m21','r4','tandoori-hete-kip',{ ar:'دجاج تندوري', nl:'Tandoori kip', en:'Tandoori chicken' }, { ar:'دجاج تندوري حار مع أرز بسمتي وسلطة رايتا', nl:'Pittige tandoorikip met basmati en raita', en:'Spicy tandoori chicken with basmati and raita' }, ['varied','healthy'], ['lunch','dinner'], 600, 46, 60, 16, ['milk'], ['spicy','high-protein','halal'], { ar:'دجاج، زبادي، تندوري، أرز، خيار', nl:'Kip, yoghurt, tandoori, rijst, komkommer', en:'Chicken, yogurt, tandoori, rice, cucumber' }),
    M('m22','r4','baingan-bharta',   { ar:'بيغان بهارتا', nl:'Baingan bharta', en:'Baingan bharta' }, { ar:'باذنجان مشوي مهروس بالبهارات الهندية مع أرز', nl:'Geroosterde, gepureerde aubergine met Indiase kruiden en rijst', en:'Smoky mashed aubergine with Indian spices and rice' }, ['vegan','healthy'], ['lunch','dinner'], 470, 12, 70, 14, [], ['vegan'], { ar:'باذنجان، طماطم، بصل، كمون، أرز', nl:'Aubergine, tomaat, ui, komijn, rijst', en:'Aubergine, tomato, onion, cumin, rice' }),
    M('m23','r4','black-beans',      { ar:'طاجن الفاصوليا السوداء', nl:'Zwarte bonen hotpot', en:'Black bean hotpot' }, { ar:'فاصوليا سوداء مطهوة مع خضار وبهارات مدخنة', nl:'Gestoofde zwarte bonen met groenten en rokerige kruiden', en:'Stewed black beans with vegetables and smoky spices' }, ['vegan','healthy'], ['dinner'], 520, 22, 76, 10, ['celery'], ['vegan','high-protein'], { ar:'فاصوليا سوداء، فلفل، ذرة، بصل', nl:'Zwarte bonen, paprika, maïs, ui', en:'Black beans, pepper, corn, onion' }),

    M('m24','r5','vegan-lasagna',    { ar:'لازانيا نباتية', nl:'Vegan lasagne', en:'Vegan lasagna' }, { ar:'طبقات لازانيا بالخضار المشوية وصلصة طماطم وبشاميل نباتي', nl:'Lasagne met geroosterde groenten, tomatensaus en plantaardige bechamel', en:'Roasted veg lasagna with tomato sauce and plant-based béchamel' }, ['vegan','varied'], ['lunch','dinner'], 580, 18, 78, 20, ['gluten','soy'], ['vegan','popular'], { ar:'معكرونة، كوسا، باذنجان، طماطم، حليب صويا', nl:'Pasta, courgette, aubergine, tomaat, sojamelk', en:'Pasta, courgette, aubergine, tomato, soy milk' }),
    M('m25','r5','fennel-paella',    { ar:'باييلا الشمر والباذنجان', nl:'Venkel-aubergine paella', en:'Fennel & aubergine paella' }, { ar:'أرز باييلا بالزعفران مع شمر وباذنجان محمّص', nl:'Saffraanpaella met geroosterde venkel en aubergine', en:'Saffron paella with roasted fennel and aubergine' }, ['vegan','healthy'], ['lunch','dinner'], 510, 12, 88, 12, [], ['vegan'], { ar:'أرز، شمر، باذنجان، زعفران، بازلاء', nl:'Rijst, venkel, aubergine, saffraan, erwten', en:'Rice, fennel, aubergine, saffron, peas' }),
    M('m26','r5','vegan-banhmi',     { ar:'بان مي نباتي', nl:'Vegan banh mi', en:'Vegan banh mi' }, { ar:'خبز باغيت مع توفو متبّل وخضار مخللة وكزبرة', nl:'Baguette met gemarineerde tofu, zoetzure groenten en koriander', en:'Baguette with marinated tofu, pickled veg and coriander' }, ['vegan'], ['lunch'], 540, 22, 70, 18, ['gluten','soy'], ['vegan','new'], { ar:'باغيت، توفو، جزر، فجل، كزبرة', nl:'Baguette, tofu, wortel, radijs, koriander', en:'Baguette, tofu, carrot, radish, coriander' }),
    M('m27','r5','aubergine-couscous',{ ar:'سلطة كسكس بالباذنجان', nl:'Aubergine couscoussalade', en:'Aubergine couscous salad' }, { ar:'كسكس مع باذنجان مشوي ورمان ونعناع', nl:'Couscous met geroosterde aubergine, granaatappel en munt', en:'Couscous with roasted aubergine, pomegranate and mint' }, ['vegan','healthy'], ['lunch'], 450, 12, 72, 12, ['gluten'], ['vegan','low-carb'], { ar:'كسكس، باذنجان، رمان، نعناع، ليمون', nl:'Couscous, aubergine, granaatappel, munt, citroen', en:'Couscous, aubergine, pomegranate, mint, lemon' }),
    M('m28','r5','aubergine-hummus', { ar:'باذنجان مشوي مع حمص', nl:'Aubergine met hummus', en:'Grilled aubergine & hummus' }, { ar:'شرائح باذنجان مشوية على حمص كريمي مع خبز بيتا', nl:'Gegrilde aubergine op romige hummus met pita', en:'Grilled aubergine on creamy hummus with pita' }, ['vegan','varied'], ['lunch','dinner'], 530, 16, 60, 24, ['sesame','gluten'], ['vegan'], { ar:'باذنجان، حمص، طحينة، بيتا', nl:'Aubergine, kikkererwten, tahin, pita', en:'Aubergine, chickpeas, tahini, pita' }),
    M('m29','r5','chickpea-fajitas', { ar:'فاهيتا الحمص', nl:'Kikkererwten fajitas', en:'Chickpea fajitas' }, { ar:'حمص محمّص بتتبيلة الفاهيتا مع فلفل ملوّن وتورتيا', nl:'Geroosterde kikkererwten met fajitakruiden, paprika en tortilla', en:'Roasted chickpeas, fajita spice, peppers and tortillas' }, ['vegan','healthy'], ['dinner'], 560, 20, 80, 16, ['gluten'], ['vegan','spicy'], { ar:'حمص، فلفل، تورتيا، ليمون', nl:'Kikkererwten, paprika, tortilla, limoen', en:'Chickpeas, peppers, tortilla, lime' }),
    M('m30','r5','green-beans',      { ar:'فاصوليا خضراء بالزيت', nl:'Sperziebonen in olijfolie', en:'Green beans in olive oil' }, { ar:'فاصوليا خضراء سورية مطهوة بزيت الزيتون والطماطم مع برغل', nl:'Syrische sperziebonen in olijfolie en tomaat met bulgur', en:'Syrian green beans with olive oil and tomato, bulgur' }, ['vegan','healthy'], ['lunch','dinner'], 420, 11, 58, 16, ['gluten'], ['vegan','low-carb'], { ar:'فاصوليا، طماطم، ثوم، زيت زيتون، برغل', nl:'Bonen, tomaat, knoflook, olijfolie, bulgur', en:'Beans, tomato, garlic, olive oil, bulgur' }),
    M('m31','r5','pepper-salad',     { ar:'سلطة الفلفل الجزائرية', nl:'Algerijnse paprikasalade', en:'Algerian pepper salad' }, { ar:'فلفل مشوي بالثوم والكمون مع خبز مكرونة القمح الكامل', nl:'Geroosterde paprika met knoflook en komijn, volkorenbrood', en:'Roasted peppers with garlic and cumin, wholegrain bread' }, ['vegan','healthy'], ['lunch'], 380, 9, 50, 15, ['gluten'], ['vegan','low-carb'], { ar:'فلفل، ثوم، كمون، زيت زيتون', nl:'Paprika, knoflook, komijn, olijfolie', en:'Peppers, garlic, cumin, olive oil' })
  ];

  const plans = {
    types: [
      { id: 'varied',  icon: '🍱', color: '#1FA06B', pricePerMeal: 11.95, name: { ar: 'متنوّع', nl: 'Gevarieerd', en: 'Varied' }, desc: { ar: 'تشكيلة من المطابخ العربية والتركية والآسيوية', nl: 'Mix van Arabische, Turkse en Aziatische keukens', en: 'A mix of Arabic, Turkish and Asian kitchens' }, kcal: '600–950' },
      { id: 'healthy', icon: '🥗', color: '#0E9384', pricePerMeal: 12.95, name: { ar: 'صحّي', nl: 'Gezond', en: 'Healthy' }, desc: { ar: 'بروتين عالي وسعرات محسوبة لأهدافك', nl: 'Eiwitrijk en calorie-bewust voor je doelen', en: 'High protein, calorie-counted for your goals' }, kcal: '400–650' },
      { id: 'vegan',   icon: '🌱', color: '#65A30D', pricePerMeal: 11.45, name: { ar: 'نباتي', nl: 'Vegan', en: 'Vegan' }, desc: { ar: '١٠٠٪ نباتي، غني بالألياف والنكهة', nl: '100% plantaardig, vol vezels en smaak', en: '100% plant-based, full of fibre and flavour' }, kcal: '380–650' }
    ],
    durations: [
      { days: 5,  discount: 0,    label: { ar: 'تجربة أسبوع', nl: 'Proefweek', en: 'Trial week' } },
      { days: 10, discount: 0.05, label: { ar: 'الأكثر شعبية', nl: 'Meest gekozen', en: 'Most popular' } },
      { days: 20, discount: 0.12, label: { ar: 'أفضل قيمة', nl: 'Beste waarde', en: 'Best value' } }
    ],
    mealOptions: [
      { id: 'lunch',  slots: ['lunch'],           discount: 0,    icon: '☀️', name: { ar: 'غداء', nl: 'Lunch', en: 'Lunch' } },
      { id: 'dinner', slots: ['dinner'],          discount: 0,    icon: '🌙', name: { ar: 'عشاء', nl: 'Diner', en: 'Dinner' } },
      { id: 'both',   slots: ['lunch', 'dinner'], discount: 0.05, icon: '🍽️', name: { ar: 'غداء وعشاء', nl: 'Lunch & diner', en: 'Lunch & dinner' } }
    ]
  };

  const banners = [
    { id: 'b1', active: true, img: '../assets/img/meals/so-salmon-bowl.jpg', color: '#0B5D3B', title: { ar: 'خصم ١٠٪ على أول اشتراك', nl: '10% korting op je eerste abonnement', en: '10% off your first plan' }, sub: { ar: 'استخدم الكود WELKOM10', nl: 'Gebruik code WELKOM10', en: 'Use code WELKOM10' } },
    { id: 'b2', active: true, img: '../assets/img/meals/vegan-lasagna.jpg', color: '#3F6212', title: { ar: 'الباقة النباتية صارت متاحة', nl: 'Het vegan-pakket is er!', en: 'The vegan plan is here' }, sub: { ar: 'أكثر من ١٠ وجبات نباتية أسبوعياً', nl: 'Meer dan 10 vegan gerechten per week', en: '10+ vegan dishes every week' } },
    { id: 'b3', active: true, img: '../assets/img/meals/kip-mandi.jpg', color: '#7C2D12', title: { ar: 'جديد: مندي على الطريقة اليمنية', nl: 'Nieuw: Jemenitische mandi', en: 'New: Yemeni-style mandi' }, sub: { ar: 'ضمن الباقة المتنوعة', nl: 'In het gevarieerde pakket', en: 'In the Varied plan' } }
  ];

  const drivers = [
    { id: 'd1', name: 'Khalid Amrani', phone: '+31 6 1111 2201', vehicle: 'e-bike', plate: '—',       pin: '1111', zone: 'Rotterdam', online: true },
    { id: 'd2', name: 'Tom Visser',    phone: '+31 6 1111 2202', vehicle: 'car',    plate: 'GX-512-K', pin: '2222', zone: 'Den Haag',  online: true },
    { id: 'd3', name: 'Bilal Yilmaz',  phone: '+31 6 1111 2203', vehicle: 'scooter',plate: 'DK-44-R',  pin: '3333', zone: 'Delft',     online: false }
  ];

  const zones = [
    { city: 'Rotterdam', fee: 0,    active: true },
    { city: 'Schiedam',  fee: 0,    active: true },
    { city: 'Den Haag',  fee: 0,    active: true },
    { city: 'Delft',     fee: 0,    active: true },
    { city: 'Rijswijk',  fee: 1.5,  active: true },
    { city: 'Capelle aan den IJssel', fee: 1.5, active: true }
  ];

  const promos = [
    { code: 'WELKOM10', type: 'percent', value: 10, active: true, uses: 0, note: { ar: 'أول اشتراك', nl: 'Eerste abonnement', en: 'First subscription' } },
    { code: 'DELYVO5',  type: 'fixed',   value: 5,  active: true, uses: 0, note: { ar: 'خصم ثابت', nl: 'Vaste korting', en: 'Fixed discount' } }
  ];

  const settings = {
    cutoffHour: 24,           // 24 = midnight: changes for a day allowed until 00:00 at the start of that day
    minLeadDays: 1,           // earliest start = tomorrow
    maxPostpones: 6,
    vatRate: 0.09,
    deliveryWindows: [
      { id: 'early', label: { ar: 'صباحاً 07:00 – 10:00', nl: "Ochtend 07:00 – 10:00", en: 'Morning 07:00 – 10:00' } },
      { id: 'noon',  label: { ar: 'ظهراً 11:00 – 13:00',  nl: 'Middag 11:00 – 13:00',  en: 'Midday 11:00 – 13:00' } },
      { id: 'eve',   label: { ar: 'مساءً 16:00 – 18:00',  nl: 'Avond 16:00 – 18:00',   en: 'Evening 16:00 – 18:00' } }
    ],
    deliveryWeekdays: [0, 1, 2, 3, 4, 5, 6],
    supportWhatsapp: '+31 6 0000 0000'
  };

  // ---------- demo customers & subscriptions ----------
  const people = [
    ['Sara Al-Hassan',  'Rotterdam', 'Coolsingel 40',        '3011 AD', ['nuts']],
    ['Omar Haddad',     'Rotterdam', 'Blaak 16',             '3011 TA', []],
    ['Lisa de Vries',   'Den Haag',  'Laan van Meerdervoort 55','2517 AE', ['milk']],
    ['Youssef Amrani',  'Schiedam',  'Broersvest 21',        '3111 EE', []],
    ['Emma Janssen',    'Delft',     'Markt 7',              '2611 GP', ['fish']],
    ['Mohammed Saleh',  'Rotterdam', 'Kruiskade 3',          '3012 EE', []],
    ['Noor Bakker',     'Den Haag',  'Spui 70',              '2511 BT', ['gluten']],
    ['Fatima Ouali',    'Rotterdam', 'Meent 88',             '3011 JP', []],
    ['Daan Visser',     'Delft',     'Phoenixstraat 12',     '2611 AL', []],
    ['Layla Mansour',   'Rijswijk',  'Herenstraat 9',        '2282 BP', ['sesame']],
    ['Ibrahim Kaya',    'Rotterdam', 'Zwart Janstraat 30',   '3035 AR', []],
    ['Sophie Smit',     'Den Haag',  'Frederikstraat 20',    '2514 LK', []],
    ['Hamza El Idrissi','Schiedam',  'Hoogstraat 101',       '3111 HD', []],
    ['Anouk Mulder',    'Capelle aan den IJssel', 'Slotplein 4', '2902 HR', ['eggs']],
    ['Khadija Benali',  'Rotterdam', 'Beijerlandselaan 60',  '3074 EK', []],
    ['Jeroen de Boer',  'Den Haag',  'Prinsegracht 14',      '2512 GA', []],
    ['Aya Haddou',      'Rotterdam', 'Weena 505',            '3013 AL', ['milk']],
    ['Mehmet Demir',    'Schiedam',  'Lange Haven 45',       '3111 CC', []],
    ['Sanne Vermeer',   'Delft',     'Brabantse Turfmarkt 3','2611 CL', []],
    ['Tariq Al-Amoudi', 'Rotterdam', 'Goudsesingel 120',     '3011 KD', []],
    ['Iris van Leeuwen','Den Haag',  'Lange Voorhout 8',     '2514 ED', ['gluten']],
    ['Rania Khoury',    'Rijswijk',  'Steenvoordelaan 30',   '2284 CX', []],
    ['Bram Hendriks',   'Rotterdam', 'Oostzeedijk 210',      '3063 BN', []],
    ['Salma Yousef',    'Delft',     'Voldersgracht 5',      '2611 EV', ['nuts']]
  ];

  // [personIdx, plan, days, option, startOffsetDays, weekdays, window]
  const subsPlan = [
    [0, 'healthy', 20, 'both',   -8, [1,2,3,4,5,6,0], 'early'],
    [1, 'varied',  10, 'lunch',  -4, [1,2,3,4,5,6,0], 'noon'],
    [2, 'vegan',   10, 'dinner', -3, [1,2,3,4,5,6,0], 'eve'],
    [3, 'varied',  20, 'both',  -11, [1,2,3,4,5,6,0], 'early'],
    [4, 'healthy',  5, 'lunch',   1, [1,2,3,4,5],     'noon'],
    [5, 'varied',   5, 'dinner', -14,[1,2,3,4,5],     'eve'],
    [6, 'healthy', 10, 'both',   -2, [1,2,3,4,5,6,0], 'early'],
    [7, 'varied',  20, 'lunch',  -6, [1,2,3,4,5,6,0], 'noon'],
    [8, 'vegan',    5, 'both',    0, [1,2,3,4,5,6,0], 'early'],
    [9, 'healthy', 10, 'dinner', -5, [1,2,3,4,5,6,0], 'eve'],
    [10,'varied',  10, 'both',   -1, [1,2,3,4,5,6,0], 'early'],
    [11,'healthy', 20, 'lunch',  -9, [1,2,3,4,5,6,0], 'noon'],
    [12,'varied',   5, 'lunch',   2, [1,2,3,4,5],     'noon'],
    [13,'vegan',   10, 'lunch',  -2, [1,2,3,4,5,6,0], 'noon'],
    [14,'varied',  20, 'both',   -7, [1,2,3,4,5,6,0], 'noon'],
    [15,'healthy', 10, 'lunch',  -3, [1,2,3,4,5,6,0], 'early'],
    [16,'varied',  10, 'dinner', -4, [1,2,3,4,5,6,0], 'eve'],
    [17,'varied',  20, 'both',  -12, [1,2,3,4,5,6,0], 'noon'],
    [18,'vegan',   10, 'both',   -1, [1,2,3,4,5,6,0], 'noon'],
    [19,'varied',   5, 'lunch',   0, [1,2,3,4,5,6,0], 'noon'],
    [20,'healthy', 20, 'dinner', -6, [1,2,3,4,5,6,0], 'eve'],
    [21,'varied',  10, 'both',   -2, [1,2,3,4,5,6,0], 'early'],
    [22,'varied',  10, 'lunch',  -5, [1,2,3,4,5,6,0], 'noon'],
    [23,'healthy', 10, 'both',   -3, [1,2,3,4,5,6,0], 'noon']
  ];

  window.DV_SEED_DATA = { ALLERGENS, TAGS, restaurants, meals, plans, banners, drivers, zones, promos, settings, people, subsPlan };
})();

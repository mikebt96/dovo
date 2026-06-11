// Recetario del plan base (mock-first): CÓMO COCINAR cada platillo del
// catálogo, en pasos cortos de cocina real MX. La clave ES el nombre exacto
// del platillo en sample-plans.ts — conTipo() la adjunta al generar. La IA
// (con key) escribirá preparaciones personalizadas; este es el piso, no lorem.

export const RECETAS: Record<string, string[]> = {
  // ── DÉFICIT · desayunos ──
  "Huevos a la mexicana + tortilla de nopal": [
    "Pica jitomate, cebolla y serrano; sofríe 2 min con poquito aceite.",
    "Agrega 2 huevos batidos y revuelve a fuego medio hasta cuajar.",
    "Calienta las tortillas de nopal en comal y sirve.",
  ],
  "Avena con fresas y claras": [
    "Cuece 40 g de avena en agua con canela 5 min.",
    "Aparte, revuelve 3 claras en sartén antiadherente.",
    "Sirve la avena con fresas en rebanadas y las claras al lado.",
  ],
  "Tostadas de requesón y pepino": [
    "Unta requesón en 2 tostadas horneadas.",
    "Encima pon pepino en rodajas finas, chile en polvo y limón.",
  ],
  "Licuado verde con proteína": [
    "Licúa espinaca, piña, jengibre y agua fría 30 segundos.",
    "Agrega el scoop de proteína y pulsa 5 segundos más para no hacer espuma.",
  ],
  // ── DÉFICIT · comidas ──
  "Pechuga a la plancha con ensalada de nopales": [
    "Salpimienta 150 g de pechuga y ásala 4 min por lado en plancha caliente.",
    "Asa los nopales hasta que cambien de color.",
    "Mezcla nopales con jitomate, cebolla morada, cilantro y limón; sirve junto.",
  ],
  "Caldo de pollo deshebrado con verduras": [
    "Hierve el caldo desgrasado con calabaza, chayote y zanahoria 10 min.",
    "Agrega 120 g de pollo cocido deshebrado y calienta 3 min.",
    "Sirve con limón y un toque de chile si quieres.",
  ],
  "Tacos de pescado a la plancha": [
    "Sazona el pescado blanco con ajo, limón y sal; plancha 3 min por lado.",
    "Calienta 3 tortillas de maíz en comal.",
    "Arma los tacos con col morada rallada y pico de gallo.",
  ],
  "Tinga de pollo con arroz integral": [
    "Sofríe cebolla en rebanadas con poquito aceite hasta transparentar.",
    "Agrega jitomate licuado con chipotle; hierve 5 min.",
    "Incorpora 120 g de pollo deshebrado y cocina 5 min; sirve con ½ taza de arroz integral.",
  ],
  "Bowl de atún con frijoles": [
    "Escurre 1 lata de atún en agua.",
    "En un bowl: frijoles de olla calientes, atún, elote, jitomate picado.",
    "Corona con ¼ de aguacate y limón.",
  ],
  // ── DÉFICIT · cenas ──
  "Sopa de lentejas con queso panela": [
    "Cuece 1 taza de lentejas con cebolla, ajo y zanahoria 25 min (o usa precocidas).",
    "Asa 40 g de panela en comal hasta dorar.",
    "Sirve la sopa con la panela encima y cilantro.",
  ],
  "Quesadillas de champiñón en comal": [
    "Saltea champiñones con epazote y ajo hasta secar su agua.",
    "Rellena 2 tortillas de maíz con quesillo ligero y el champiñón.",
    "Dóralas en comal hasta fundir.",
  ],
  "Ensalada de pollo y aguacate": [
    "Mezcla lechuga, pepino y ¼ de aguacate en cubos.",
    "Agrega 100 g de pollo cocido en tiras.",
    "Adereza con limón, aceite de oliva (1 cdita), sal y pimienta.",
  ],
  "Molletes integrales con pico de gallo": [
    "Unta frijoles en 1 bolillo integral abierto; poco queso encima.",
    "Gratina en sartén tapado u horno 5 min.",
    "Sirve con pico de gallo fresco.",
  ],
  // ── DÉFICIT · snacks ──
  "Jícama con chile y limón": ["Pela y corta la jícama en bastones; limón y chile en polvo."],
  "Yogurt griego natural": ["Sirve 150 g de yogurt griego sin azúcar; espolvorea canela."],
  "Puño de cacahuate natural": ["Pesa 25 g de cacahuate sin sal (un puño) y listo."],
  // ── DÉFICIT · veggie ──
  "Bowl de garbanzo al chipotle": [
    "Sofríe garbanzos cocidos con jitomate licuado y chipotle 5 min.",
    "Sirve sobre ½ taza de arroz integral con ¼ de aguacate.",
  ],
  "Chiles rellenos de queso al horno": [
    "Asa 2 poblanos, súdalos en bolsa y pélalos; ábrelos y desvénalos.",
    "Rellena con panela y hornea 10 min a 200 °C (sin capear).",
    "Baña con caldillo de jitomate hervido con cebolla y ajo.",
  ],
  "Tacos de coliflor al pastor": [
    "Marina floretes de coliflor con pasta de achiote, piña y vinagre 15 min.",
    "Hornea 20 min a 220 °C hasta dorar.",
    "Sirve en 3 tortillas con piña asada, cebolla y cilantro.",
  ],
  "Sopa azteca ligera sin pollo": [
    "Licúa jitomate, ajo y cebolla; hierve 10 min con epazote.",
    "Hornea tiras de tortilla hasta crujir (sin freír).",
    "Sirve con las tiras, aguacate y panela en cubos.",
  ],
  "Ensalada de quinoa y frijol negro": [
    "Cuece ½ taza de quinoa (15 min) y enfría.",
    "Mezcla con frijol negro, elote, pimiento y cilantro.",
    "Adereza con limón, comino y sal.",
  ],

  // ── MANTENIMIENTO · desayunos ──
  "Chilaquiles verdes con huevo": [
    "Hornea totopos de tortilla hasta crujir.",
    "Hierve salsa verde 5 min y baña los totopos.",
    "Corona con 2 huevos estrellados (sartén antiadherente) y crema ligera.",
  ],
  "Avena con plátano y crema de cacahuate": [
    "Cuece 50 g de avena en leche o agua 5 min.",
    "Sirve con plátano en rodajas y 1 cda de crema de cacahuate.",
  ],
  "Molletes con frijol y queso": [
    "Unta frijoles refritos ligeros en bolillo abierto; queso encima.",
    "Gratina en horno o sartén tapado hasta fundir.",
    "Termina con pico de gallo.",
  ],
  "Smoothie de mango con yogurt y granola": [
    "Licúa mango con yogurt natural y hielo.",
    "Sirve y corona con 30 g de granola.",
  ],
  // ── MANTENIMIENTO · comidas ──
  "Arroz con pollo a la mexicana": [
    "Dora el arroz con poquito aceite; agrega jitomate licuado con ajo.",
    "Suma caldo, chícharo, zanahoria y 150 g de pollo en trozos.",
    "Tapa y cuece a fuego bajo 18 min.",
  ],
  "Enchiladas verdes (3) con pollo": [
    "Pasa 3 tortillas por salsa verde caliente (sin freír).",
    "Rellena con pollo deshebrado y enrolla.",
    "Baña con más salsa, crema ligera y panela rallada.",
  ],
  "Pozole rojo de pollo (1 plato)": [
    "Hierve maíz pozolero precocido en caldo con chile guajillo licuado 20 min.",
    "Agrega pollo deshebrado y sazona.",
    "Sirve con rábano, lechuga, orégano y 1 tostada horneada.",
  ],
  "Pescado a la veracruzana con arroz": [
    "Sofríe jitomate, cebolla, aceituna y alcaparra 5 min.",
    "Agrega el filete y cuece tapado 8 min en la salsa.",
    "Sirve con arroz blanco.",
  ],
  "Tortas de milanesa de pollo (1 chica)": [
    "Asa la milanesa delgada en comal (sin freír).",
    "Arma el bolillo con aguacate, jitomate y la milanesa.",
    "Plancha la torta 2 min por lado.",
  ],
  // ── MANTENIMIENTO · cenas ──
  "Tacos de frijol con queso (3)": [
    "Calienta frijoles refritos ligeros.",
    "Rellena 3 tortillas de maíz, agrega queso fresco y salsa.",
    "Dóralas ligeramente en comal.",
  ],
  "Sándwich de pavo con aguacate": [
    "Tuesta 2 panes integrales.",
    "Arma con 80 g de pavo, aguacate y jitomate.",
  ],
  "Sopes de pollo (2)": [
    "Calienta 2 sopes en comal y úntales frijol.",
    "Agrega pollo deshebrado, lechuga, crema ligera y salsa.",
  ],
  "Omelette de espinaca con queso": [
    "Bate 3 huevos; viértelos en sartén antiadherente a fuego medio.",
    "Agrega espinaca y queso Oaxaca; dobla cuando cuaje.",
    "Sirve con 1 tortilla de comal.",
  ],
  // ── MANTENIMIENTO · snacks ──
  "Plátano con crema de cacahuate": ["Rebana 1 plátano y úntale 1 cda de crema de cacahuate."],
  "Yogurt con granola": ["Sirve 150 g de yogurt natural con 20 g de granola."],
  "Fruta de temporada con tajín": ["Corta 1.5 tazas de fruta y espolvorea tajín y limón."],
  // ── MANTENIMIENTO · veggie ──
  "Enfrijoladas con queso (3)": [
    "Licúa frijoles cocidos con su caldo y un toque de chipotle; calienta.",
    "Pasa 3 tortillas por el frijol y dóblalas.",
    "Corona con queso fresco, crema ligera y cebolla.",
  ],
  "Arroz a la jardinera con huevo": [
    "Prepara arroz rojo con verduras (chícharo, zanahoria, elote).",
    "Estrella 2 huevos en sartén antiadherente y sírvelos encima.",
  ],
  "Tlacoyos de requesón con nopales (2)": [
    "Calienta 2 tlacoyos de requesón en comal.",
    "Encima: nopales asados picados, salsa y queso rallado.",
  ],
  "Quesadillas de flor de calabaza (3)": [
    "Saltea la flor de calabaza con cebolla y epazote 3 min.",
    "Rellena 3 tortillas con quesillo y la flor; dora en comal.",
  ],
  "Tostadas de frijol y aguacate (2)": [
    "Unta frijoles en 2 tostadas horneadas.",
    "Agrega aguacate, col rallada y salsa.",
  ],

  // ── SUPERÁVIT · desayunos ──
  "Huevos revueltos con jamón de pavo + avena": [
    "Revuelve 3 huevos con 60 g de pavo picado en sartén.",
    "Aparte, cuece 50 g de avena y sírvela con plátano.",
  ],
  "Hotcakes de avena con fruta y yogurt": [
    "Licúa 60 g de avena, 1 plátano, 1 huevo y polvo de hornear.",
    "Haz 3 hotcakes en sartén antiadherente a fuego medio.",
    "Sirve con yogurt griego, fruta y un hilo de miel.",
  ],
  "Burrito de huevo y frijol (2)": [
    "Revuelve 3 huevos; calienta frijoles refritos.",
    "Rellena 2 tortillas de harina con huevo, frijol y aguacate; enrolla.",
    "Sella los burritos 1 min por lado en comal.",
  ],
  "Licuado de avena, plátano y proteína": [
    "Licúa leche, 40 g de avena, 1 plátano y 1 cda de cacahuate.",
    "Agrega el scoop de proteína y pulsa 5 segundos.",
  ],
  // ── SUPERÁVIT · comidas ──
  "Bistec a la mexicana con arroz y frijol": [
    "Sella 180 g de bistec en tiras a fuego alto.",
    "Agrega jitomate, cebolla y serrano picados; guisa 8 min.",
    "Sirve con arroz rojo, frijoles de olla y tortillas.",
  ],
  "Pollo en mole con arroz (1 pieza grande)": [
    "Disuelve el mole en pasta con caldo caliente; hierve 10 min moviendo.",
    "Agrega pierna y muslo cocidos; calienta 5 min.",
    "Sirve con arroz y ajonjolí tostado.",
  ],
  "Tacos de bistec con frijoles charros (4)": [
    "Pica y asa el bistec en plancha bien caliente.",
    "Calienta los frijoles charros.",
    "Arma 4 tacos con cebolla, cilantro y salsa; los charros de lado.",
  ],
  "Salmón a la plancha con pasta": [
    "Salpimienta 160 g de salmón; plancha 4 min por lado.",
    "Cuece la pasta al dente; saltéala con ajo y aceite de oliva.",
    "Sirve con ensalada verde.",
  ],
  "Milanesa de res con puré y verdura": [
    "Asa la milanesa en comal o plancha (sin freír de más).",
    "Machaca papa cocida con leche para el puré.",
    "Hierve ejotes 5 min y sirve todo junto.",
  ],
  // ── SUPERÁVIT · cenas ──
  "Quesadillas de pollo con aguacate (3)": [
    "Rellena 3 tortillas con pollo deshebrado y quesillo.",
    "Dora en comal hasta fundir; sirve con aguacate.",
  ],
  "Bowl de arroz, huevo y frijol": [
    "Calienta arroz y frijoles.",
    "Estrella 2 huevos y móntalos encima.",
    "Termina con aguacate y salsa macha.",
  ],
  "Torta de pierna ligera": [
    "Calienta la pierna deshebrada en su jugo.",
    "Arma el bolillo con frijol, pierna y aguacate; plancha 2 min.",
  ],
  "Pan francés proteico con fruta": [
    "Bate huevo con proteína y canela; remoja 3 rebanadas de pan.",
    "Dóralas en sartén antiadherente 2 min por lado.",
    "Sirve con plátano y un hilo de miel.",
  ],
  // ── SUPERÁVIT · snacks ──
  "Sándwich chico de crema de cacahuate": ["Unta 1.5 cda de crema de cacahuate en 1 rebanada y dóblala."],
  "Licuado de chocolate con leche": ["Licúa leche entera, 1 cda de cocoa y 1 plátano."],
  "Mix de nuez y pasas": ["Mezcla 30 g de nuez con 20 g de pasas."],
  // ── SUPERÁVIT · veggie ──
  "Chiles rellenos de queso con arroz (2)": [
    "Asa, suda y pela 2 poblanos; rellénalos de queso.",
    "Hornea 10 min a 200 °C y baña con caldillo de jitomate.",
    "Sirve con arroz rojo y tortillas.",
  ],
  "Pasta con crema de chipotle y panela": [
    "Cuece la pasta al dente.",
    "Licúa crema ligera con chipotle; caliéntala y mezcla con la pasta.",
    "Agrega panela asada en cubos y elote.",
  ],
  "Burrito de frijol, arroz y queso (2)": [
    "Calienta frijol y arroz; ralla el queso.",
    "Rellena 2 tortillas de harina, agrega aguacate y enrolla.",
    "Sella en comal 1 min por lado.",
  ],
  "Molletes dobles con queso y frijol": [
    "Unta frijol en 2 mitades grandes de bolillo; queso generoso.",
    "Gratina en horno hasta burbujear; pico de gallo encima.",
  ],
  "Bowl de quinoa, huevo y aguacate": [
    "Cuece ½ taza de quinoa 15 min.",
    "Estrella 2 huevos; móntalos sobre la quinoa.",
    "Agrega aguacate y garbanzo rostizado.",
  ],
};

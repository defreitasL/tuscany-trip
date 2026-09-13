"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Ship, CalendarDays, Check, ChevronRight, CircleAlert,
  Clock3, Coffee, ExternalLink, MapPin, Plane, RotateCcw, Save, Sparkles, TrainFront, Utensils,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type City = "Milan" | "Florence" | "Milan → Como" | "Lake Como";
type PlanItem = { id: string; time: string; title: string; detail: string; location: string; booked?: boolean; buffer?: string };
type DayPlan = { offset: number; city: City; kicker: string; title: string; note: string; coords: [number, number]; zoomBox: [number, number, number, number]; items: PlanItem[] };

const STORAGE_KEY = "lucas-italy-planner-v2";

const initialDays: DayPlan[] = [
  {
    offset: 0, city: "Milan", kicker: "Arrival night", title: "Land, reset, sleep near Centrale",
    note: "Keep this evening intentionally light—the 06:10 train makes location more valuable than sightseeing.",
    coords: [45.484, 9.204], zoomBox: [9.14, 45.44, 9.25, 45.51],
    items: [
      { id: "mxp-arrival", time: "19:00", title: "Land at MXP", detail: "Allow 60–90 min for passport control, bags and the walk to the railway station.", location: "Malpensa Airport", booked: true, buffer: "+90 min arrival buffer" },
      { id: "mxp-train", time: "20:45", title: "Malpensa Express to Milan", detail: "Prefer Milano Centrale if your hotel is nearby. Cadorna is faster only when it suits the hotel location.", location: "MXP → Milan", buffer: "Aim for the train after your first feasible one" },
      { id: "milan-sleep", time: "22:00", title: "Check in & prepare", detail: "Keep tickets, breakfast and luggage ready before sleeping.", location: "Milan", buffer: "Hotel near Centrale recommended" },
    ],
  },
  {
    offset: 1, city: "Florence", kicker: "First Florence day", title: "The city opens up from the river",
    note: "A gentle first day: drop bags, see the historic core, then cross to Oltrarno for sunset.",
    coords: [43.773, 11.256], zoomBox: [11.22, 43.75, 11.29, 43.79],
    items: [
      { id: "train-florence", time: "06:10", title: "High-speed train to Florence", detail: "Planned Frecciarossa from Milano Centrale; typical direct journey is about 1 h 54 min. Verify the exact train number on the ticket.", location: "Milano Centrale → Firenze S.M.N.", buffer: "At platform by 05:50" },
      { id: "florence-drop", time: "08:15", title: "Bag drop & breakfast", detail: "Firenze S.M.N. is walkable to the centre. Confirm early luggage storage with the hotel.", location: "Santa Maria Novella" },
      { id: "florence-core", time: "10:00", title: "Duomo district walk", detail: "Piazza del Duomo, Baptistery exterior, Via dei Calzaiuoli and Piazza della Signoria.", location: "Historic centre" },
      { id: "florence-lunch", time: "13:00", title: "Mercato Centrale lunch", detail: "Flexible lunch stop that keeps the afternoon easy.", location: "San Lorenzo" },
      { id: "oltrarno", time: "16:00", title: "Ponte Vecchio & Oltrarno", detail: "Cross the river, explore Santo Spirito, then climb gradually toward the viewpoint.", location: "Oltrarno" },
      { id: "sunset", time: "19:00", title: "Piazzale Michelangelo", detail: "Arrive 30–45 min before sunset; take bus 12/13 uphill if legs are tired.", location: "Piazzale Michelangelo", buffer: "+45 min before sunset" },
    ],
  },
  {
    offset: 2, city: "Florence", kicker: "Booked day trip", title: "Tuscany beyond Florence",
    note: "This day is already committed. Add your provider’s meeting point and exact start time below.",
    coords: [43.467, 11.044], zoomBox: [10.55, 43.15, 11.65, 43.85],
    items: [
      { id: "daytrip-meet", time: "07:15", title: "Meet the day-trip group", detail: "Placeholder time—replace it with the voucher time and meeting point.", location: "Add meeting point", booked: true, buffer: "Arrive 15 min early" },
      { id: "daytrip", time: "07:30", title: "Full-day Tuscany trip", detail: "Booked for Tuesday. Keep water, sun protection and comfortable shoes ready.", location: "Tuscany", booked: true },
      { id: "daytrip-return", time: "20:00", title: "Expected return to Florence", detail: "Keep dinner flexible in case road traffic delays the group.", location: "Florence", buffer: "+60 min dinner flexibility" },
    ],
  },
  {
    offset: 3, city: "Florence", kicker: "Masterpiece morning", title: "David first, Renaissance Florence after",
    note: "The 08:30 Accademia slot is excellent: quieter galleries and the rest of the day stays open.",
    coords: [43.777, 11.259], zoomBox: [11.235, 43.758, 11.282, 43.79],
    items: [
      { id: "david", time: "08:30", title: "Galleria dell’Accademia — David", detail: "Tickets booked. Check the voucher for the correct entrance or collection point.", location: "Via Ricasoli 58/60", booked: true, buffer: "Be there by 08:10" },
      { id: "coffee", time: "10:15", title: "Coffee near Santissima Annunziata", detail: "A quiet reset after the gallery before the central sights get busy.", location: "Piazza SS. Annunziata" },
      { id: "palazzo", time: "11:30", title: "Piazza della Signoria", detail: "Palazzo Vecchio exterior, Loggia dei Lanzi and the Uffizi courtyard.", location: "Piazza della Signoria" },
      { id: "uffizi", time: "14:00", title: "Uffizi or Palazzo Pitti", detail: "Choose one major museum; reserve ahead if you want the Uffizi.", location: "Florence", buffer: "Allow 2.5–3 h" },
      { id: "last-evening", time: "18:30", title: "Last Florence evening", detail: "Arno walk, aperitivo in Santo Spirito and pack before bed.", location: "Oltrarno" },
    ],
  },
  {
    offset: 4, city: "Milan → Como", kicker: "Milan stopover", title: "Milan’s essentials, then the lake",
    note: "Leave bags at Centrale, enjoy a compact Milan loop, then continue to Como before dinner.",
    coords: [45.466, 9.19], zoomBox: [9.14, 45.44, 9.24, 45.5],
    items: [
      { id: "leave-florence", time: "08:00", title: "Leave Florence", detail: "Compare Frecciarossa and Italo to Milano Centrale; direct high-speed services take roughly 1 h 55–2 h 10.", location: "Firenze S.M.N. → Milano Centrale", buffer: "At station by 07:35" },
      { id: "bags-milan", time: "10:05", title: "Leave luggage at Centrale", detail: "Use station storage so the Milan stop stays easy. Keep 20–30 min for drop-off and collection queues.", location: "Milano Centrale", buffer: "+30 min baggage margin" },
      { id: "milan-centre", time: "10:45", title: "Duomo & Galleria", detail: "Metro to Duomo, cathedral exterior or pre-booked rooftop, then Galleria Vittorio Emanuele II.", location: "Piazza del Duomo, Milan" },
      { id: "brera", time: "12:45", title: "Brera lunch & walk", detail: "Walk through Piazza della Scala into Brera; keep the Pinacoteca for another visit unless pre-booked.", location: "Brera, Milan" },
      { id: "train-como", time: "16:15", title: "Regional train to Como", detail: "Collect bags and take a direct regional service from Centrale to Como S. Giovanni, typically about 40 minutes.", location: "Milano Centrale → Como S. Giovanni", buffer: "Back at Centrale by 15:40" },
      { id: "como-evening", time: "17:15", title: "Como check-in & lakefront", detail: "Cathedral, Piazza San Fedele, promenade and dinner in the old town. Save Brunate for a future full lake day.", location: "Como centre" },
    ],
  },
  {
    offset: 5, city: "Lake Como", kicker: "Lake morning + flight", title: "A beautiful morning with a hard stop",
    note: "The flight controls this day. Use fast boats only, keep luggage in Como, and treat 15:15 as the latest comfortable departure for MXP.",
    coords: [45.987, 9.261], zoomBox: [8.9, 45.75, 9.45, 46.08],
    items: [
      { id: "boat-out", time: "08:40", title: "Fast boat toward Bellagio", detail: "Planning placeholder based on the summer timetable. Reserve rapid service and reconfirm the exact departure the day before.", location: "Como → Bellagio", buffer: "At dock by 08:20" },
      { id: "bellagio", time: "09:30", title: "Bellagio walk", detail: "Lakeside, Salita Serbelloni and breakfast or early lunch. Skip distant villas today.", location: "Bellagio" },
      { id: "boat-back", time: "12:00", title: "Return fast boat", detail: "Choose a departure that gets you back to Como by about 13:30. Weather can suspend services.", location: "Bellagio → Como", buffer: "Do not rely on the final viable boat" },
      { id: "airport-run", time: "15:15", title: "Leave Como for MXP", detail: "Preferred public route: Como S. Giovanni → Saronno → Malpensa. Allow about 1 h 25–1 h 45 and one change.", location: "Como → MXP", buffer: "Target airport arrival by 17:00" },
      { id: "flight-home", time: "20:00", title: "Flight from Malpensa", detail: "Placeholder based on your previous plan—edit if the ticket differs.", location: "MXP", booked: true, buffer: "3 h airport buffer" },
    ],
  },
];

const transportGroups = {
  "Arrival · MXP → Milan": [
    { name: "Malpensa Express → Centrale", duration: "~51–58 min", changes: "Direct", best: "Best for 06:10 next day", note: "Choose this if sleeping near Milano Centrale.", url: "https://www.malpensaexpress.it/en/" },
    { name: "Malpensa Express → Cadorna", duration: "~37–43 min", changes: "Direct", best: "Fastest into central Milan", note: "Only better if the hotel is near Cadorna or the western centre.", url: "https://www.malpensaexpress.it/en/" },
    { name: "Taxi", duration: "~50–75 min", changes: "Door to door", best: "Late arrival / heavy bags", note: "Traffic-sensitive and far more expensive.", url: "https://www.milanomalpensa-airport.com/en/from-to/by-taxi" },
  ],
  "Milan → Florence": [
    { name: "Frecciarossa · planned 06:10", duration: "~1 h 54", changes: "Direct", best: "Matches your plan", note: "Milano Centrale to Firenze S.M.N.; verify train number and arrival on the ticket.", url: "https://www.trenitalia.com/en.html" },
    { name: "Italo high-speed", duration: "~1 h 55–2 h 05", changes: "Direct", best: "Price comparison", note: "Compare fare conditions as well as headline price.", url: "https://www.italotreno.com/en" },
  ],
  "Florence → Como": [
    { name: "High-speed + regional via Milan", duration: "~2 h 45–3 h 15", changes: "1", best: "Recommended", note: "Use a 25–35 min change at Milano Centrale.", url: "https://www.trenitalia.com/en.html" },
    { name: "High-speed + Como Lago route", duration: "~3 h 10–3 h 40", changes: "1–2", best: "Closest to waterfront", note: "May involve changing stations in Milan; less convenient with luggage.", url: "https://www.trenord.it/en/" },
  ],
  "Lake Como boats": [
    { name: "Rapid service · Como ↔ Bellagio", duration: "~45–70 min each way", changes: "Direct", best: "Flight-day option", note: "Supplement applies; limited capacity. Be at the dock 20 min early.", url: "https://www.navigazionelaghi.it/en/tickets-and-timetables-lake-como/" },
    { name: "Regular boat · Como ↔ Bellagio", duration: "~2–2.5 h each way", changes: "Direct", best: "Scenic, not for flight day", note: "Lovely but consumes too much of 25 September.", url: "https://www.navigazionelaghi.it/en/tickets-and-timetables-lake-como/" },
    { name: "Central-lake ferry", duration: "~15–30 min", changes: "Bellagio / Varenna / Menaggio", best: "Town hopping", note: "Excellent on a full lake day; risky when starting and ending in Como before a flight.", url: "https://www.navigazionelaghi.it/en/tickets-and-timetables-lake-como/" },
  ],
  "Como → MXP": [
    { name: "Train via Saronno", duration: "~1 h 25–1 h 45", changes: "1", best: "Recommended public route", note: "Protect at least 15–20 min at Saronno.", url: "https://www.trenord.it/en/" },
    { name: "Train via Milano Centrale", duration: "~1 h 50–2 h 20", changes: "1", best: "Simple backup", note: "Longer, but easy to understand if Saronno timings are poor.", url: "https://www.malpensaexpress.it/en/" },
    { name: "Taxi / private transfer", duration: "~45–70 min", changes: "Door to door", best: "Most comfortable", note: "Keep a traffic margin; pre-arrange pickup if choosing this.", url: "https://www.milanomalpensa-airport.com/en/from-to/by-taxi" },
  ],
};

const dayTrips = [
  { name: "Booked Tuscany day", time: "Full day · Tue 22", rhythm: "Fixed", detail: "Your confirmed choice. Add the provider’s exact meeting point and start time to the itinerary." },
  { name: "Pisa independently", time: "5–6 h", rhythm: "Easy by train", detail: "Best as a focused half-day from Firenze S.M.N.; reserve the Tower separately if climbing." },
  { name: "Bologna", time: "6–8 h", rhythm: "Fastest rail escape", detail: "High-speed trains can take about 38 min; ideal for food and porticoes." },
  { name: "Siena independently", time: "8–10 h", rhythm: "Bus is usually simpler", detail: "More atmospheric but slower; save for a future trip unless the booked tour omits Siena." },
];

const officialLinks = [
  ["Trenitalia", "https://www.trenitalia.com/en.html"], ["Italo", "https://www.italotreno.com/en"],
  ["Malpensa Express", "https://www.malpensaexpress.it/en/"], ["Lake Como boats", "https://www.navigazionelaghi.it/en/tickets-and-timetables-lake-como/"],
  ["Accademia", "https://www.galleriaaccademiafirenze.it/en/tickets/"], ["Uffizi", "https://www.uffizi.it/en/tickets"],
  ["Florence Duomo", "https://duomo.firenze.it/en/home"],
];

type FoodCity = "Milan" | "Florence" | "Lake Como";
type Language = "es" | "en";

const ES_COPY: Record<string, string> = {
  "Lucas’s trip, at a glance": "El viaje de Lucas, de un vistazo",
  "Arrival date": "Fecha de llegada", "Flight time": "Hora del vuelo", "Save": "Guardar", "Saved": "Guardado", "Reset": "Restablecer",
  "Day plan": "Plan diario", "Compare travel": "Transportes", "Map & places": "Mapa", "Comer local": "Comer local",
  "Arrival night": "Noche de llegada", "First Florence day": "Primer día en Florencia", "Booked day trip": "Excursión reservada", "Masterpiece morning": "Mañana de obras maestras", "Milan stopover": "Escala en Milán", "Lake morning + flight": "Lago + vuelo",
  "Land, reset, sleep near Centrale": "Llegar, descansar y dormir cerca de Centrale", "The city opens up from the river": "Descubrir Florencia desde el río", "Tuscany beyond Florence": "La Toscana más allá de Florencia", "David first, Renaissance Florence after": "Primero el David; después, la Florencia renacentista", "Milan’s essentials, then the lake": "Lo esencial de Milán y después el lago", "A beautiful morning with a hard stop": "Una mañana preciosa con hora límite",
  "Land at MXP": "Llegada a Malpensa", "Malpensa Express to Milan": "Malpensa Express a Milán", "Check in & prepare": "Check-in y preparación", "High-speed train to Florence": "Tren de alta velocidad a Florencia", "Bag drop & breakfast": "Dejar equipaje y desayunar", "Duomo district walk": "Paseo por el Duomo", "Mercato Centrale lunch": "Comida en Mercato Centrale", "Ponte Vecchio & Oltrarno": "Ponte Vecchio y Oltrarno", "Meet the day-trip group": "Encuentro con la excursión", "Full-day Tuscany trip": "Excursión de día completo por Toscana", "Expected return to Florence": "Regreso previsto a Florencia", "Coffee near Santissima Annunziata": "Café junto a Santissima Annunziata", "Uffizi or Palazzo Pitti": "Uffizi o Palazzo Pitti", "Last Florence evening": "Última noche en Florencia", "Leave Florence": "Salida de Florencia", "Leave luggage at Centrale": "Dejar el equipaje en Centrale", "Duomo & Galleria": "Duomo y Galleria", "Brera lunch & walk": "Comida y paseo por Brera", "Regional train to Como": "Tren regional a Como", "Como check-in & lakefront": "Check-in en Como y paseo junto al lago", "Fast boat toward Bellagio": "Barco rápido a Bellagio", "Bellagio walk": "Paseo por Bellagio", "Return fast boat": "Barco rápido de regreso", "Leave Como for MXP": "Salida de Como hacia MXP", "Flight from Malpensa": "Vuelo desde Malpensa",
  "Booked": "Reservado", "Ready": "Listo", "Mark ready": "Marcar listo", "Bookings count as ready": "Las reservas cuentan como preparadas",
  "Travel legs": "Trayectos", "Side-by-side": "Comparación", "Travel time": "Duración", "Changes": "Cambios", "Best for": "Ideal para", "Florence day trips": "Excursiones desde Florencia", "What each option costs in time": "Tiempo necesario para cada opción",
  "Select a stop to open it in Google Maps. The embedded map is for orientation; use live navigation on the day.": "Selecciona una parada para abrirla en Google Maps. El mapa sirve para orientarse; usa navegación en directo durante el viaje.",
  "Eat by region": "Comer por regiones", "Neighbourhood shortlist": "Selección de barrio", "Breakfast": "Desayuno", "Lunch": "Comida", "Dinner": "Cena", "Sweet": "Dulce",
  "Café & bakery": "Cafetería y panadería", "Traditional trattoria": "Trattoria tradicional", "Modern Lombard": "Cocina lombarda moderna", "Artisan gelato": "Heladería artesanal", "Bakery & breakfast": "Panadería y desayuno", "No-frills trattoria": "Trattoria sencilla", "Tuscan trattoria": "Trattoria toscana", "Street-food stand": "Comida callejera", "Historic osteria": "Osteria histórica", "Larian dinner": "Cena lariana", "Pastry & coffee": "Pastelería y café", "Bellagio breakfast": "Desayuno en Bellagio",
  "Pasta & Tuscan": "Pasta y cocina toscana", "Market lunch": "Comida de mercado", "Classic trattoria": "Trattoria clásica", "Tuscan offal & pasta": "Casquería toscana y pasta",
  "Eat your main traditional meals in Oltrarno and San Frediano. They fit your walks and generally feel more neighbourhood-led than the streets immediately around the Duomo.": "Haced las principales comidas tradicionales en Oltrarno y San Frediano. Encajan con vuestros paseos y tienen más ambiente de barrio que las calles inmediatas al Duomo.",
  "Cappuccino + cornetto": "Cappuccino + cornetto", "Keep it Italian and quick. A budino di riso—a little rice-pudding tart—is the most Florentine pastry choice.": "Desayuno italiano y rápido. El budino di riso, una tartaleta de arroz con leche, es la opción más florentina.",
  "Schiacciata or lampredotto": "Schiacciata o lampredotto", "Schiacciata is Tuscan flatbread; lampredotto is the traditional tripe sandwich, best with green sauce and chilli.": "La schiacciata es un pan plano toscano; el lampredotto es el bocadillo tradicional de tripa, mejor con salsa verde y picante.",
  "Ribollita, peposo or bistecca": "Ribollita, peposo o bistecca", "Ribollita is bread-and-vegetable soup; peposo is peppery beef stew. Share bistecca, sold by weight, only if you like it rare.": "La ribollita es una sopa de pan y verduras; el peposo, un guiso de ternera con pimienta. Compartid la bistecca, vendida al peso, solo si os gusta poco hecha.",
  "Gelato + cantucci": "Gelato + cantucci", "Choose gelato made in-house; finish another meal with almond cantucci dipped in Vin Santo.": "Elegid gelato elaborado en el local; terminad otra comida con cantucci de almendra mojados en Vin Santo.",
  "A relaxed neighbourhood bakery that fits naturally before or after your Oltrarno walk.": "Panadería tranquila de barrio que encaja antes o después del paseo por Oltrarno.", "Budino di riso, schiacciata and coffee.": "Budino di riso, schiacciata y café.",
  "A weekday, family-run dining room with simple daily Tuscan dishes and honest prices.": "Comedor familiar de diario, con platos toscanos sencillos y precios honestos.", "Choose from the daily primi and a Tuscan stew.": "Elegid un primo del día y algún guiso toscano.",
  "Homestyle cucina povera in the exact neighbourhood planned for your evenings.": "Cucina povera casera en el mismo barrio previsto para vuestras noches.", "Ribollita, pappa al pomodoro, peposo or roast meats.": "Ribollita, pappa al pomodoro, peposo o carnes asadas.",
  "A focused local lunch stop that is easy to combine with the eastern side of the historic centre.": "Parada local para comer, fácil de combinar con la zona oriental del centro histórico.", "Panino al lampredotto, bagnato, with salsa verde and piccante.": "Panino al lampredotto, bagnato, con salsa verde y picante.",
  "Small-batch gelato in a residential part of Oltrarno, close to your evening route.": "Gelato de producción pequeña en una zona residencial de Oltrarno, cerca de vuestra ruta nocturna.", "Ask for seasonal flavours; try crema or dark chocolate.": "Preguntad por sabores de temporada; probad crema o chocolate negro.",
  "A lively option directly on your evening route, especially useful when you want pasta rather than another meat-heavy dinner.": "Opción animada en vuestra ruta nocturna, ideal cuando queráis pasta en lugar de otra cena centrada en carne.", "Baked truffle gnocchi; check whether lasagne al ragù is on the daily menu.": "Gnocchi gratinados con trufa; comprobad si hay lasagne al ragù en el menú del día.",
  "Communal tables and a short daily menu inside the market; an excellent fit for a quick local lunch.": "Mesas compartidas y menú corto dentro del mercado; perfecto para una comida local rápida.", "Lasagne or pasta of the day, followed by a simple Tuscan second course.": "Lasaña o pasta del día y, si apetece, un segundo toscano sencillo.",
  "A long-standing family trattoria with a broad menu, good for one special but still traditional dinner.": "Trattoria familiar histórica con carta amplia, adecuada para una cena especial pero tradicional.", "Fresh ravioli or tagliolini; ask about the seasonal sauce.": "Ravioli frescos o tagliolini; preguntad por la salsa de temporada.",
  "A small Oltrarno address for a more adventurous Florentine meal, with excellent pasta alternatives too.": "Pequeño local de Oltrarno para una comida florentina más atrevida, también con buenas pastas.", "Ravioli or tagliatelle; try lampredotto only if you enjoy offal.": "Ravioli o tagliatelle; probad lampredotto solo si os gusta la casquería.",
};

const foodGuides: Record<FoodCity, {
  dates: string;
  strategy: string;
  meals: { label: string; title: string; detail: string }[];
  venues: { name: string; kind: string; area: string; why: string; order: string; tip: string; url: string; official?: string }[];
}> = {
  Milan: {
    dates: "20 & 24 September",
    strategy: "Your useful food window is 24 September: breakfast near Centrale, then a traditional lunch before the train to Como. Arrival night is too tight for a destination dinner.",
    meals: [
      { label: "Breakfast", title: "Cappuccino + brioche", detail: "Order at the counter. Try a plain brioche, or one filled with crema, apricot or pistachio." },
      { label: "Lunch", title: "Risotto alla milanese", detail: "Saffron risotto; pair it with ossobuco if you want the full Lombard classic, or choose mondeghili as a starter." },
      { label: "Dinner", title: "Cotoletta alla milanese", detail: "A breaded veal cutlet, traditionally bone-in. Ask whether it is the thin or thick version before ordering." },
      { label: "Sweet", title: "Panettone or artisan gelato", detail: "Panettone is eaten year-round at good bakeries; for gelato, favour natural colours and covered tubs." },
    ],
    venues: [
      { name: "Pavé · Via Felice Casati", kind: "Café & bakery", area: "Near Centrale", why: "A practical quality stop after leaving your bags at Centrale.", order: "Cappuccino and a fresh brioche; panettone if available.", tip: "Best fit: 24 Sep morning", url: "https://www.google.com/maps/search/?api=1&query=Pav%C3%A9+Via+Felice+Casati+Milano", official: "https://pavemilano.com/" },
      { name: "Trattoria Milanese", kind: "Traditional trattoria", area: "Historic centre", why: "Old-school Milanese cooking in a simple dining room, close enough to your Duomo–Brera loop.", order: "Risotto giallo, ossobuco or mondeghili.", tip: "Reserve lunch", url: "https://www.google.com/maps/search/?api=1&query=Trattoria+Milanese+Via+Santa+Marta+Milano" },
      { name: "Ratanà", kind: "Modern Lombard", area: "Porta Nuova", why: "A polished interpretation of Milanese and Lombard recipes, away from the Duomo dining strip.", order: "Risotto alla milanese; check the seasonal menu.", tip: "Reserve · allow 90 min", url: "https://www.google.com/maps/search/?api=1&query=Ratan%C3%A0+Milano", official: "https://www.ratana.it/" },
      { name: "Gelateria Paganelli", kind: "Artisan gelato", area: "North of Centrale", why: "A family-style gelateria that rewards a small detour rather than a queue beside the Duomo.", order: "Pistachio, hazelnut or a seasonal fruit flavour.", tip: "Detour stop", url: "https://www.google.com/maps/search/?api=1&query=Gelateria+Paganelli+Milano" },
    ],
  },
  Florence: {
    dates: "21–23 September",
    strategy: "Eat your main traditional meals in Oltrarno and San Frediano. They fit your walks and generally feel more neighbourhood-led than the streets immediately around the Duomo.",
    meals: [
      { label: "Breakfast", title: "Cappuccino + cornetto", detail: "Keep it Italian and quick. A budino di riso—a little rice-pudding tart—is the most Florentine pastry choice." },
      { label: "Lunch", title: "Schiacciata or lampredotto", detail: "Schiacciata is Tuscan flatbread; lampredotto is the traditional tripe sandwich, best with green sauce and chilli." },
      { label: "Dinner", title: "Ribollita, peposo or bistecca", detail: "Ribollita is bread-and-vegetable soup; peposo is peppery beef stew. Share bistecca, sold by weight, only if you like it rare." },
      { label: "Sweet", title: "Gelato + cantucci", detail: "Choose gelato made in-house; finish another meal with almond cantucci dipped in Vin Santo." },
    ],
    venues: [
      { name: "S.forno", kind: "Bakery & breakfast", area: "Santo Spirito", why: "A relaxed neighbourhood bakery that fits naturally before or after your Oltrarno walk.", order: "Budino di riso, schiacciata and coffee.", tip: "Walk in early", url: "https://www.google.com/maps/search/?api=1&query=S.forno+Firenze" },
      { name: "Trattoria Sabatino", kind: "No-frills trattoria", area: "Porta San Frediano", why: "A weekday, family-run dining room with simple daily Tuscan dishes and honest prices.", order: "Choose from the daily primi and a Tuscan stew.", tip: "Mon–Fri · go early", url: "https://www.google.com/maps/search/?api=1&query=Trattoria+Sabatino+Firenze" },
      { name: "Trattoria La Casalinga", kind: "Tuscan trattoria", area: "Santo Spirito", why: "Homestyle cucina povera in the exact neighbourhood planned for your evenings.", order: "Ribollita, pappa al pomodoro, peposo or roast meats.", tip: "Reserve dinner", url: "https://www.google.com/maps/search/?api=1&query=Trattoria+La+Casalinga+Firenze" },
      { name: "Sergio Pollini Lampredotto", kind: "Street-food stand", area: "Sant’Ambrogio", why: "A focused local lunch stop that is easy to combine with the eastern side of the historic centre.", order: "Panino al lampredotto, bagnato, with salsa verde and piccante.", tip: "Lunch only · cash handy", url: "https://www.google.com/maps/search/?api=1&query=Sergio+Pollini+Lampredotto+Firenze" },
      { name: "La Sorbettiera", kind: "Artisan gelato", area: "San Frediano", why: "Small-batch gelato in a residential part of Oltrarno, close to your evening route.", order: "Ask for seasonal flavours; try crema or dark chocolate.", tip: "Best after Oltrarno", url: "https://www.google.com/maps/search/?api=1&query=La+Sorbettiera+Via+Mazzetta+Firenze", official: "https://www.lasorbettiera.it/" },
      { name: "Osteria Santo Spirito", kind: "Pasta & Tuscan", area: "Santo Spirito", why: "A lively option directly on your evening route, especially useful when you want pasta rather than another meat-heavy dinner.", order: "Baked truffle gnocchi; check whether lasagne al ragù is on the daily menu.", tip: "Reserve · lively atmosphere", url: "https://www.google.com/maps/search/?api=1&query=Osteria+Santo+Spirito+Firenze" },
      { name: "Trattoria da Rocco", kind: "Market lunch", area: "Sant’Ambrogio", why: "Communal tables and a short daily menu inside the market; an excellent fit for a quick local lunch.", order: "Lasagne or pasta of the day, followed by a simple Tuscan second course.", tip: "Lunch only · before 13:00", url: "https://www.google.com/maps/search/?api=1&query=Trattoria+da+Rocco+Firenze" },
      { name: "Cammillo Trattoria", kind: "Classic trattoria", area: "Near Ponte Vecchio", why: "A long-standing family trattoria with a broad menu, good for one special but still traditional dinner.", order: "Fresh ravioli or tagliolini; ask about the seasonal sauce.", tip: "Reserve well ahead", url: "https://www.google.com/maps/search/?api=1&query=Cammillo+Trattoria+Firenze" },
      { name: "Il Magazzino", kind: "Tuscan offal & pasta", area: "Piazza della Passera", why: "A small Oltrarno address for a more adventurous Florentine meal, with excellent pasta alternatives too.", order: "Ravioli or tagliatelle; try lampredotto only if you enjoy offal.", tip: "Reserve dinner", url: "https://www.google.com/maps/search/?api=1&query=Il+Magazzino+Firenze" },
    ],
  },
  "Lake Como": {
    dates: "24–25 September",
    strategy: "Have the proper lake dinner in Como on the 24th. On flight day, keep Bellagio food quick and protect the return boat—do not let lunch put the 15:15 airport departure at risk.",
    meals: [
      { label: "Breakfast", title: "Espresso + pastry", detail: "Keep breakfast light before the fast boat: coffee, a fresh cornetto and perhaps a small local cake." },
      { label: "Lunch", title: "Lake fish + polenta", detail: "Look for lavarello or missoltini; the latter are dried lake fish, usually grilled and served with polenta." },
      { label: "Dinner", title: "Risotto con pesce persico", detail: "Perch fillets served over buttered rice are the signature lake order; polenta uncia is the richer mountain alternative." },
      { label: "Sweet", title: "Miascia or gelato", detail: "Miascia is a rustic bread-and-fruit cake. It is not always on the menu, so take it when you see it." },
    ],
    venues: [
      { name: "Osteria del Gallo", kind: "Historic osteria", area: "Como old town", why: "A tiny, traditional-feeling room in Via Vitani that works perfectly after your lakefront walk.", order: "Ask for the day’s Lombard or lake dish and house wine.", tip: "Reserve for 24 Sep", url: "https://www.google.com/maps/search/?api=1&query=Osteria+del+Gallo+Como" },
      { name: "Crotto del Sergente", kind: "Larian dinner", area: "Como outskirts", why: "A destination meal in a traditional grotto setting, with a strong regional focus.", order: "Lake fish, polenta or the seasonal tasting choices.", tip: "Reserve · taxi needed", url: "https://www.google.com/maps/search/?api=1&query=Crotto+del+Sergente+Como", official: "https://www.crottodelsergente.it/" },
      { name: "Pasticceria Poletti", kind: "Pastry & coffee", area: "Cernobbio", why: "A locally loved pastry stop if you pass through Cernobbio; not worth risking the boat schedule just for breakfast.", order: "Espresso and whichever pastry has just come from the oven.", tip: "Only if it fits the route", url: "https://www.google.com/maps/search/?api=1&query=Pasticceria+Poletti+Cernobbio" },
      { name: "Gelateria Rossetti", kind: "Artisan gelato", area: "Como centre", why: "A straightforward gelato stop back in Como, away from the busiest lakefront counters.", order: "Hazelnut, dark chocolate or seasonal fruit sorbet.", tip: "Easy after dinner", url: "https://www.google.com/maps/search/?api=1&query=Gelateria+Rossetti+Como" },
      { name: "Pasticceria Sancassani", kind: "Bellagio breakfast", area: "Bellagio", why: "A practical pastry option during your short Bellagio window, listed by the town’s tourism site.", order: "Coffee and a quick pastry—then keep moving toward the return boat.", tip: "Quick stop only", url: "https://www.google.com/maps/search/?api=1&query=Pasticceria+Sancassani+Bellagio", official: "https://www.bellagiolakecomo.com/en/bellagio-lake-como-italy/POI-points-of-interest/breakfast" },
    ],
  },
};

const florenceMealPlan = [
  { slot: "Comida 1 · lunes", dish: "Pasta o lasaña", place: "Trattoria da Rocco o Sabatino", note: "Da Rocco si queréis lasaña/pasta del día; Sabatino para un menú toscano sencillo." },
  { slot: "Cena 1 · lunes", dish: "Ribollita + peposo", place: "La Casalinga", note: "Primera cena muy florentina en Oltrarno. Reservad y compartid un entrante." },
  { slot: "Cena 2 · martes", dish: "Pasta fresca o gnocchi", place: "Osteria Santo Spirito", note: "Buena opción al volver de la excursión; mantened la reserva flexible por posibles retrasos." },
  { slot: "Comida 2 · miércoles", dish: "Lampredotto o schiacciata", place: "Sergio Pollini o S.forno", note: "Comida rápida tras el David para aprovechar la tarde." },
  { slot: "Cena 3 · miércoles", dish: "Ravioli/tagliolini o bistecca", place: "Cammillo o Il Magazzino", note: "Última cena: Cammillo para pasta clásica; Il Magazzino para sabores florentinos más atrevidos." },
];

const cityColors: Record<City, string> = { Milan: "bg-[#df5b3f]", Florence: "bg-[#315f54]", "Milan → Como": "bg-[#755d43]", "Lake Como": "bg-[#2777a4]" };

function formatDate(base: string, offset: number, long = false, locale = "en-GB") {
  const date = new Date(`${base}T12:00:00`); date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat(locale, long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric" }).format(date);
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("es");
  const [startDate, setStartDate] = useState("2026-09-20");
  const [flightTime, setFlightTime] = useState("20:00");
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState("plan");
  const [days, setDays] = useState(initialDays);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [compareGroup, setCompareGroup] = useState(Object.keys(transportGroups)[0]);
  const [foodCity, setFoodCity] = useState<FoodCity>("Florence");
  const [saved, setSaved] = useState(false);

  useEffect(() => { try { const data = localStorage.getItem(STORAGE_KEY); if (!data) return; const parsed = JSON.parse(data); if (parsed.startDate) setStartDate(parsed.startDate); if (parsed.flightTime) setFlightTime(parsed.flightTime); if (parsed.days) setDays(parsed.days); if (parsed.checked) setChecked(parsed.checked); if (parsed.language) setLanguage(parsed.language); } catch {} }, []);
  useEffect(() => { setDays((current) => current.map((day) => day.offset === 5 ? { ...day, items: day.items.map((item) => item.id === "flight-home" ? { ...item, time: flightTime } : item) } : day)); }, [flightTime]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const savePlan = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ startDate, flightTime, days, checked, language })); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const resetPlan = () => { if (!window.confirm("Reset dates, times and checkmarks to the original trip plan?")) return; setStartDate("2026-09-20"); setFlightTime("20:00"); setDays(initialDays); setChecked({}); localStorage.removeItem(STORAGE_KEY); };
  const updateTime = (dayOffset: number, itemId: string, time: string) => setDays((current) => current.map((day) => day.offset === dayOffset ? { ...day, items: day.items.map((item) => item.id === itemId ? { ...item, time } : item) } : day));
  const active = days[selectedDay];
  const tr = (text: string) => language === "es" ? (ES_COPY[text] ?? text) : text;
  const cityName = (city: City | FoodCity) => language === "es" ? ({ Milan: "Milán", Florence: "Florencia", "Milan → Como": "Milán → Como", "Lake Como": "Lago de Como" }[city] ?? city) : city;
  const mapZoom = active.city === "Lake Como" ? 10 : 13;
  const mapUrl = `https://www.google.com/maps?q=${active.coords[0]},${active.coords[1]}&z=${mapZoom}&output=embed`;
  const progress = useMemo(() => { const all = days.flatMap((day) => day.items); const done = all.filter((item) => checked[item.id] || item.booked).length; return { done, total: all.length, percent: Math.round((done / all.length) * 100) }; }, [days, checked]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool?.({ name: "select_itinerary_day", title: "Select itinerary day", description: "Open one day of the Italy itinerary by its zero-based day offset from arrival.", inputSchema: { type: "object", properties: { dayOffset: { type: "integer", minimum: 0, maximum: 5 } }, required: ["dayOffset"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const value = (input as { dayOffset?: number })?.dayOffset; if (!Number.isInteger(value) || value! < 0 || value! > 5) throw new Error("dayOffset must be an integer from 0 to 5"); setSelectedDay(value!); setActiveTab("plan"); return { selectedDayOffset: value, city: days[value!].city }; } }, { signal: lifecycle.signal });
      await context.registerTool?.({ name: "update_trip_dates", title: "Update trip dates", description: "Update the arrival date and flight departure time shown throughout the planner.", inputSchema: { type: "object", properties: { arrivalDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, flightTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" } }, required: ["arrivalDate", "flightTime"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const value = input as { arrivalDate?: string; flightTime?: string }; if (!/^\d{4}-\d{2}-\d{2}$/.test(value.arrivalDate ?? "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.flightTime ?? "")) throw new Error("Use YYYY-MM-DD and HH:MM values"); setStartDate(value.arrivalDate!); setFlightTime(value.flightTime!); return { arrivalDate: value.arrivalDate, flightTime: value.flightTime }; } }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined); return () => lifecycle.abort();
  }, [days]);

  return <main className="min-h-screen overflow-x-hidden bg-[#f6f2e9] pb-20 text-[#17211f] sm:pb-0">
    <header className="border-b border-black/10 bg-[#f6f2e9]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#315f54]"><span className="inline-block h-2 w-2 rounded-full bg-[#df5b3f]" />{language === "es" ? "Italia · Septiembre" : "Italy · September"}</div><h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{tr("Lucas’s trip, at a glance")}</h1></div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div className="col-span-2 flex min-h-11 items-center rounded-xl border border-black/15 bg-white p-1 sm:col-span-1" aria-label="Language"><button onClick={() => setLanguage("es")} className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold ${language === "es" ? "bg-[#17211f] text-white" : "text-black/55"}`}>ES</button><button onClick={() => setLanguage("en")} className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold ${language === "en" ? "bg-[#17211f] text-white" : "text-black/55"}`}>EN</button></div>
          <label className="text-sm font-semibold text-black/65">{tr("Arrival date")}<input aria-label={tr("Arrival date")} type="date" value={startDate} onInput={(e) => setStartDate(e.currentTarget.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-base text-[#17211f] shadow-sm outline-none focus:border-[#315f54] focus:ring-2 focus:ring-[#315f54]/15" /></label>
          <label className="text-sm font-semibold text-black/65">{tr("Flight time")}<input aria-label={tr("Flight time")} type="time" value={flightTime} onInput={(e) => setFlightTime(e.currentTarget.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-base text-[#17211f] shadow-sm outline-none focus:border-[#315f54] focus:ring-2 focus:ring-[#315f54]/15" /></label>
          <button onClick={savePlan} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17211f] px-4 text-sm font-semibold text-white transition hover:bg-[#315f54] focus:outline-none focus:ring-2 focus:ring-[#315f54] focus:ring-offset-2">{saved ? <Check size={17} /> : <Save size={17} />} {tr(saved ? "Saved" : "Save")}</button>
          <button onClick={resetPlan} aria-label={tr("Reset")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold transition hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#315f54]"><RotateCcw size={16} /> {tr("Reset")}</button>
        </div>
      </div>
    </header>

    <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-10">
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="navigation" aria-label="Trip days">
          {days.map((day, index) => <button key={day.offset} onClick={() => setSelectedDay(index)} aria-current={selectedDay === index ? "date" : undefined} className={`min-w-[112px] rounded-2xl border px-3 py-3 text-left transition sm:min-w-[126px] sm:px-4 focus:outline-none focus:ring-2 focus:ring-[#315f54] ${selectedDay === index ? "border-[#17211f] bg-[#17211f] text-white shadow-lg" : "border-black/10 bg-white/75 hover:border-black/25"}`}><span className="block text-sm font-semibold opacity-70">{formatDate(startDate, day.offset, false, language === "es" ? "es-ES" : "en-GB")}</span><span className="mt-1 block text-sm font-semibold sm:text-base">{cityName(day.city)}</span></button>)}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/75 px-4 py-3"><div className="relative h-10 w-10 rounded-full" style={{ background: `conic-gradient(#315f54 ${progress.percent * 3.6}deg, #e8e1d5 0deg)` }}><div className="absolute inset-[5px] rounded-full bg-white" /></div><div><div className="text-sm font-semibold">{language === "es" ? `${progress.done} de ${progress.total} marcados` : `${progress.done} of ${progress.total} marked`}</div><div className="text-sm text-black/55">{tr("Bookings count as ready")}</div></div></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="sticky top-2 z-20 mb-5 grid h-auto w-full grid-cols-4 rounded-2xl border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur sm:static sm:w-[690px] sm:p-1.5 sm:shadow-none"><TabsTrigger value="plan" className="min-h-11 rounded-xl px-1 text-xs sm:text-sm">{tr("Day plan")}</TabsTrigger><TabsTrigger value="compare" className="min-h-11 rounded-xl px-1 text-xs sm:text-sm">{tr("Compare travel")}</TabsTrigger><TabsTrigger value="map" className="min-h-11 rounded-xl px-1 text-xs sm:text-sm">{tr("Map & places")}</TabsTrigger><TabsTrigger value="food" className="min-h-11 rounded-xl px-1 text-xs sm:text-sm">{tr("Comer local")}</TabsTrigger></TabsList>

        <TabsContent value="plan" className="mt-0"><div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.55fr)]">
          <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(36,48,43,.08)]">
            <div className="relative overflow-hidden border-b border-black/10 bg-[#315f54] px-5 py-6 text-white sm:px-8 sm:py-7"><div className="absolute -right-16 -top-24 h-52 w-52 rounded-full border-[28px] border-white/8" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/65 sm:tracking-[0.16em]"><CalendarDays size={16} /> {formatDate(startDate, active.offset, true, language === "es" ? "es-ES" : "en-GB")} · {tr(active.kicker)}</div><h2 className="max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">{tr(active.title)}</h2><p className="mt-3 max-w-2xl text-base leading-relaxed text-white/78">{active.note}</p></div><span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white/12 px-3 py-2 text-sm font-semibold backdrop-blur sm:self-auto"><MapPin size={15} /> {cityName(active.city)}</span></div></div>
            <div className="divide-y divide-black/8">{active.items.map((item, index) => { const isDone = Boolean(checked[item.id] || item.booked); return <article key={item.id} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 px-4 py-5 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:gap-5 sm:px-8"><div><input aria-label={`${language === "es" ? "Hora de" : "Time for"} ${tr(item.title)}`} type="time" value={item.time} onInput={(e) => updateTime(active.offset, item.id, e.currentTarget.value)} className="w-[70px] rounded-lg border border-black/10 bg-[#f6f2e9] px-1.5 py-2 text-sm font-bold tabular-nums outline-none focus:border-[#315f54] focus:ring-2 focus:ring-[#315f54]/15 sm:w-[86px] sm:px-2" />{index < active.items.length - 1 && <div className="ml-4 mt-2 h-10 w-px bg-black/12 sm:ml-5" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold leading-tight">{tr(item.title)}</h3>{item.booked && <span className="rounded-full bg-[#315f54]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#315f54]">{tr("Booked")}</span>}</div><p className="mt-1 text-base leading-relaxed text-black/62">{item.detail}</p><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black/52"><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{item.location}</span>{item.buffer && <span className="inline-flex items-center gap-1.5 font-semibold text-[#a94731]"><Clock3 size={14} />{item.buffer}</span>}</div></div><button aria-label={`${isDone ? "Unmark" : "Mark"} ${item.title}`} onClick={() => setChecked((current) => ({ ...current, [item.id]: !isDone }))} className={`col-start-2 mt-1 inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-xl border px-3 text-sm font-semibold transition sm:col-start-auto sm:mt-0 sm:justify-self-auto ${isDone ? "border-[#315f54] bg-[#315f54] text-white" : "border-black/15 bg-white hover:bg-black/5"}`}><Check size={16} /> {tr(isDone ? "Ready" : "Mark ready")}</button></article>; })}</div>
          </section>
          <aside className="space-y-5">
            <div className="rounded-[24px] border border-[#df5b3f]/25 bg-[#fff5ef] p-5 sm:p-6"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 shrink-0 text-[#c34f36]" size={21} /><div><h3 className="font-semibold">No action has been booked here</h3><p className="mt-1 text-sm leading-relaxed text-black/62">The planner only organises your choices and opens official sources. Existing bookings are labels, not new transactions.</p></div></div></div>
            <div className="rounded-[24px] border border-black/10 bg-[#e8efe9] p-5 sm:p-6"><div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#315f54]"><Sparkles size={16} /> Critical buffers</div><ul className="space-y-3 text-sm leading-relaxed"><li><strong>20 Sep:</strong> don’t pre-commit to the first possible airport train.</li><li><strong>21 Sep:</strong> reach Centrale by 05:50 for the 06:10 departure.</li><li><strong>25 Sep:</strong> be back in Como by about 13:30; leave by 15:15.</li></ul></div>
            <div className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-6"><h3 className="font-serif text-2xl font-semibold">Official sources</h3><div className="mt-4 grid gap-2">{officialLinks.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="group flex min-h-11 items-center justify-between rounded-xl border border-black/9 px-3 text-sm font-semibold transition hover:border-[#315f54]/45 hover:bg-[#e8efe9]"><span>{label}</span><ExternalLink size={15} className="text-black/38 transition group-hover:text-[#315f54]" /></a>)}</div><p className="mt-4 text-xs leading-relaxed text-black/48">Lake timetable checked: summer service valid 1 July–4 October 2026. Operators may change schedules or suspend boats in bad weather.</p></div>
          </aside>
        </div></TabsContent>

        <TabsContent value="compare" className="mt-0"><div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-black/10 bg-white p-3"><h2 className="px-3 pb-3 pt-2 font-serif text-2xl font-semibold">Travel legs</h2><div className="space-y-1">{Object.keys(transportGroups).map((group) => <button key={group} onClick={() => setCompareGroup(group)} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition ${compareGroup === group ? "bg-[#17211f] text-white" : "hover:bg-black/5"}`}><span>{group}</span><ChevronRight size={16} /></button>)}</div></aside>
          <section className="overflow-hidden rounded-[24px] border border-black/10 bg-white"><div className="border-b border-black/10 px-5 py-5 sm:px-7"><div className="text-sm font-bold uppercase tracking-[0.15em] text-[#315f54]">Side-by-side</div><h2 className="mt-1 font-serif text-3xl font-semibold">{compareGroup}</h2></div><div className="grid divide-y divide-black/8">{transportGroups[compareGroup as keyof typeof transportGroups].map((option, index) => <article key={option.name} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(200px,1.2fr)_110px_110px_minmax(180px,1fr)_44px] md:items-center sm:px-7"><div><div className="flex items-center gap-2">{compareGroup.includes("boat") ? <Ship size={18} className="text-[#2777a4]" /> : compareGroup.includes("MXP") && index === 2 ? <Plane size={18} className="text-[#df5b3f]" /> : <TrainFront size={18} className="text-[#315f54]" />}<h3 className="font-semibold">{option.name}</h3></div><p className="mt-1 text-sm leading-relaxed text-black/56">{option.note}</p></div><div><span className="block text-xs font-bold uppercase tracking-wide text-black/42">Travel time</span><span className="mt-1 block font-semibold">{option.duration}</span></div><div><span className="block text-xs font-bold uppercase tracking-wide text-black/42">Changes</span><span className="mt-1 block font-semibold">{option.changes}</span></div><div><span className="block text-xs font-bold uppercase tracking-wide text-black/42">Best for</span><span className="mt-1 block font-semibold text-[#315f54]">{option.best}</span></div><a href={option.url} target="_blank" rel="noreferrer" aria-label={`Open official source for ${option.name}`} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 hover:bg-black/5"><ExternalLink size={17} /></a></article>)}</div></section>
        </div>
          <section className="mt-5 rounded-[24px] border border-black/10 bg-[#17211f] p-5 text-white sm:p-7"><div className="grid gap-6 lg:grid-cols-[260px_1fr]"><div><div className="text-sm font-bold uppercase tracking-[0.15em] text-[#9dd4c5]">Florence day trips</div><h2 className="mt-2 font-serif text-3xl font-semibold">What each option costs in time</h2><p className="mt-3 text-sm leading-relaxed text-white/60">Your Tuesday tour is already booked; these alternatives are useful only for comparison or a future visit.</p></div><div className="grid gap-3 md:grid-cols-2">{dayTrips.map((trip) => <article key={trip.name} className="rounded-2xl border border-white/12 bg-white/6 p-4"><div className="flex items-start justify-between gap-4"><h3 className="font-semibold">{trip.name}</h3><span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">{trip.time}</span></div><p className="mt-2 text-sm font-semibold text-[#9dd4c5]">{trip.rhythm}</p><p className="mt-1 text-sm leading-relaxed text-white/58">{trip.detail}</p></article>)}</div></div></section>
        </TabsContent>

        <TabsContent value="map" className="mt-0"><div className="grid overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(36,48,43,.08)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-black/10 p-5 lg:border-b-0 lg:border-r sm:p-7"><div className={`mb-5 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold text-white ${cityColors[active.city]}`}>{cityName(active.city)}</div><h2 className="font-serif text-3xl font-semibold">{formatDate(startDate, active.offset, true)}</h2><p className="mt-2 text-base leading-relaxed text-black/58">{tr("Select a stop to open it in Google Maps. The embedded map is for orientation; use live navigation on the day.")}</p><div className="mt-6 space-y-2">{active.items.map((item) => <a key={item.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" rel="noreferrer" className="group flex min-h-14 items-center gap-3 rounded-xl border border-black/9 p-3 transition hover:border-[#315f54]/40 hover:bg-[#e8efe9]"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f2e9] text-sm font-bold tabular-nums">{item.time}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{tr(item.title)}</strong><span className="block truncate text-sm text-black/48">{item.location}</span></span><ArrowRight size={16} className="shrink-0 text-black/32 transition group-hover:translate-x-1 group-hover:text-[#315f54]" /></a>)}</div></aside>
          <div className="relative min-h-[520px] bg-[#dce8e3]"><iframe key={mapUrl} title={`Map of ${active.city}`} src={mapUrl} loading="lazy" className="absolute inset-0 h-full w-full border-0" /><div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/50 bg-[#17211f]/90 px-4 py-3 text-sm text-white shadow-xl backdrop-blur sm:left-auto sm:max-w-sm"><div className="flex items-center gap-2 font-semibold"><MapPin size={16} /> Map focus: {active.city}</div><p className="mt-1 text-white/65">Dates and times update the planner; map pins open live directions in a new tab.</p></div></div>
        </div></TabsContent>

        <TabsContent value="food" className="mt-0">
          <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
            <aside className="self-start rounded-[24px] border border-black/10 bg-[#17211f] p-4 text-white xl:sticky xl:top-5">
              <div className="px-2 pb-4 pt-1"><div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#9dd4c5]"><Utensils size={16} /> {tr("Eat by region")}</div><h2 className="font-serif text-3xl font-semibold">{language === "es" ? "Comer bien sin caer en trampas" : "Eat well, skip the tourist traps"}</h2><p className="mt-3 text-sm leading-relaxed text-white/65">{language === "es" ? "Selección local y práctica para vuestro recorrido. Confirma horarios y reserva donde se indica." : "A local, practical shortlist for your route. Confirm opening hours and reserve where noted."}</p></div>
              <div className="grid grid-cols-3 gap-1 xl:block xl:space-y-1">{(Object.keys(foodGuides) as FoodCity[]).map((city) => <button key={city} onClick={() => setFoodCity(city)} className={`flex min-h-14 w-full items-center justify-center rounded-xl px-2 text-center transition xl:justify-between xl:px-3 xl:text-left ${foodCity === city ? "bg-white text-[#17211f]" : "text-white hover:bg-white/8"}`}><span><strong className="block text-sm">{cityName(city)}</strong><span className={`hidden text-xs xl:block ${foodCity === city ? "text-black/50" : "text-white/45"}`}>{foodGuides[city].dates}</span></span><ChevronRight size={17} className="hidden xl:block" /></button>)}</div>
            </aside>

            <section className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(36,48,43,.08)]">
                <div className="border-b border-black/10 bg-[#df5b3f] px-5 py-6 text-white sm:px-7"><div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-white/70"><Coffee size={16} /> {foodGuides[foodCity].dates}</div><h2 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">{language === "es" ? "Qué pedir en" : "What to order in"} {cityName(foodCity)}</h2><p className="mt-3 max-w-3xl text-base leading-relaxed text-white/82">{tr(foodGuides[foodCity].strategy)}</p></div>
                <div className="grid divide-y divide-black/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{foodGuides[foodCity].meals.map((meal) => <article key={meal.label} className="p-5 sm:p-6"><span className="text-xs font-bold uppercase tracking-[0.14em] text-[#a94731]">{tr(meal.label)}</span><h3 className="mt-1 text-lg font-semibold">{tr(meal.title)}</h3><p className="mt-2 text-sm leading-relaxed text-black/58">{tr(meal.detail)}</p></article>)}</div>
              </div>

              {foodCity === "Florence" && <div className="rounded-[28px] border border-[#315f54]/20 bg-[#e8efe9] p-5 sm:p-7"><div className="text-sm font-bold uppercase tracking-[0.15em] text-[#315f54]">{language === "es" ? "Propuesta para vuestra estancia" : "Suggested plan for your stay"}</div><h2 className="mt-1 font-serif text-3xl font-semibold">{language === "es" ? "2 comidas + 3 cenas, sin repetir" : "2 lunches + 3 dinners, no repeats"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{florenceMealPlan.map((meal) => <article key={meal.slot} className="rounded-2xl bg-white p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#a94731]">{meal.slot}</span><h3 className="mt-1 font-semibold">{meal.dish}</h3><p className="mt-1 text-sm font-semibold text-[#315f54]">{meal.place}</p><p className="mt-2 text-sm leading-relaxed text-black/55">{meal.note}</p></article>)}</div></div>}

              <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-7"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-sm font-bold uppercase tracking-[0.15em] text-[#315f54]">{tr("Neighbourhood shortlist")}</div><h2 className="mt-1 font-serif text-3xl font-semibold">{language === "es" ? "Locales que sí encajan en la ruta" : "Places that fit your route"}</h2></div><span className="text-sm text-black/45">{language === "es" ? "No se reserva nada desde aquí" : "Nothing is booked from here"}</span></div>
                <div className="grid gap-3 lg:grid-cols-2">{foodGuides[foodCity].venues.map((venue) => <article key={venue.name} className="flex min-h-[220px] flex-col rounded-2xl border border-black/9 bg-[#faf8f3] p-4 sm:min-h-[230px] sm:p-5"><div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3"><div><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#315f54]">{tr(venue.kind)}</span><h3 className="mt-1 text-lg font-semibold">{venue.name}</h3></div><span className="rounded-full bg-[#e8efe9] px-2.5 py-1 text-xs font-semibold text-[#315f54]">{venue.area}</span></div><p className="mt-3 text-sm leading-relaxed text-black/58">{tr(venue.why)}</p><div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm"><strong>{language === "es" ? "Qué pedir:" : "Order:"}</strong> <span className="text-black/58">{tr(venue.order)}</span></div><div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4"><span className="text-xs font-bold uppercase tracking-wide text-[#a94731]">{tr(venue.tip)}</span><div className="flex gap-2">{venue.official && <a href={venue.official} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold hover:bg-black/5">Web <ExternalLink size={14} /></a>}<a href={venue.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#17211f] px-3 text-sm font-semibold text-white hover:bg-[#315f54]"><MapPin size={14} /> Map</a></div></div></article>)}</div>
                <div className="mt-5 rounded-2xl border border-[#df5b3f]/20 bg-[#fff5ef] px-4 py-3 text-sm leading-relaxed text-black/60"><strong className="text-[#a94731]">Regla anti-trampa:</strong> evita menús con fotos, captadores en la puerta y cartas interminables junto a los monumentos. Busca una carta corta, productos de temporada y precios visibles; incluso un buen local puede llenarse de visitantes.</div>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </section>
    <footer className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 pb-8 pt-2 text-sm text-black/48 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-10"><span>Private planning workspace · Changes stay on this device when saved.</span><span>Times are planning estimates until confirmed on operator tickets.</span></footer>
  </main>;
}

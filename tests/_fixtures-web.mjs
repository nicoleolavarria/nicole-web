/* Datos de prueba para el renderizador de la web (24-oct-2026). Cubren la web tal como está hoy
   (nadie tocó nada = {}) y una web muy editada, en las seis páginas. */
export const PAGINAS = ["inicio", "acerca", "trayectoria", "formacion", "sesiones", "contacto"];
export const WEBS = {
  vacio: {},
  editada: {
    v: 2,
    inicio: { titulo: "hola :)", sub: "Una voz propia, a tu ritmo. Cantante y artista, con muchos años de oficio, en Lima." },
    acerca: { titulo: "Nicole", sub: "soprano", intro: ["Primero.", "Segundo **fuerte**.", "Tercero *suave*."], foto: { url: "/images/foto-1.jpg", pos: "20% 30%" },
      bloques: [{ tipo: "titulo", texto: "Formación y más" }, { tipo: "parrafo", texto: "Texto uno\ncon salto." }, { tipo: "foto", url: "/images/foto-2.jpg", pos: "50% 50%" }, { tipo: "titulo", texto: "Trabajo" }, { tipo: "parrafo", texto: "Texto dos." }],
      galeria: [{ url: "/images/foto-3.jpg", pos: "50% 50%" }] },
    trayectoria: { titulo: "Trayectoria", sub: "lo hecho", foto: { url: "/images/foto-4.jpg", pos: "50% 50%" }, bloques: [{ tipo: "titulo", texto: "2024" }, { tipo: "parrafo", texto: "Algo pasó." }, { tipo: "parrafo", texto: "Otra cosa." }] },
    formacion: { titulo: "Formación", sub: "", foto: { url: "", pos: "50% 50%" }, bloques: [{ tipo: "titulo", texto: "Estudios" }, { tipo: "parrafo", texto: "Universidad." }] },
    sesiones: { titulo: "Sesiones", intro: ["Una hora.", "Individual."], nota: "Foto: alguien", foto: { url: "/images/sesiones.jpg", pos: "50% 50%" }, cta: { texto: "agenda", url: "https://wa.me/519" },
      titulo_modalidades: "modalidades", modalidades: [{ nombre: "A", desc: "uno" }, { nombre: "B", desc: "" }, { nombre: "C", desc: "tres" }], metas: ["Lima", "cupos"] },
    contacto: { titulo: "Escríbeme", items: [{ label: "wa", valor: "+51 9", url: "https://wa.me/519" }, { label: "ubicación", valor: "Lima", url: "" }, { label: "ig", valor: "@ni", url: "https://instagram.com/ni" }] }
  },
  listasVacias: { v: 2, acerca: { intro: [], bloques: [], galeria: [] }, sesiones: { intro: [], modalidades: [], metas: [], nota: "", cta: { texto: "", url: "" }, titulo_modalidades: "" }, contacto: { items: [] }, trayectoria: { bloques: [] } }
};

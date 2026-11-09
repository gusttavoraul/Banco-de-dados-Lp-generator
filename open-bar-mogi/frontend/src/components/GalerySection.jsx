import evento1 from "../assets/gallery/evento1.jpeg"
import evento2 from "../assets/gallery/evento2.jpeg"
import evento3 from "../assets/gallery/evento3.jpeg"
import evento4 from "../assets/gallery/evento4.jpeg"
import evento5 from "../assets/gallery/evento5.jpeg"
import evento6 from "../assets/gallery/evento6.jpeg"


function GallerySection() {

  const images = [
  evento1,
  evento2,
  evento3,
  evento4,
  evento5,
  evento6,
]

  return (
    <section className="px-6 lg:px-20 py-24 bg-zinc-900">
      <div className="max-w-6xl mx-auto">
        <p className="text-yellow-500 font-semibold uppercase tracking-widest mb-4">
          Galeria
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Momentos que mostram a experiência.
        </h2>

        <p className="text-zinc-400 text-lg mb-12 max-w-2xl">
          Fotos e vídeos reais dos eventos atendidos pela Equipe Open Bar Mogi.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Evento ${index + 1}`}
              className="w-full h-72 object-cover rounded-2xl border border-zinc-700 hover:scale-105 transition duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default GallerySection
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
        test
        <p className="font-bold text-center text-4xl font-vcr text-fear">
          bold text
        </p>
      </main>
      <Footer />
    </>
  );
}

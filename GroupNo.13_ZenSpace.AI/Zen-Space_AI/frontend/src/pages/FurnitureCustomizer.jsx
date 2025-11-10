import ChairImg from '../designs/pro2.1.jpg';
import ChairQR from '../designs/Brown-Dining-Chair-AR-Code.jpg';


import ShelfImg from '../designs/pro3.3.jpg';
import ShelfQR from '../designs/Drawer-Cabinet-Furniture-3D-AR.jpg';


import CoffeeTableImg from '../designs/pro4.1.jpg';
import CoffeeTableQR from '../designs/Modern-Art-Design-Coffee-Table-in-AR.jpg';


import WoodenShelfImg from '../designs/pro5.3.jpg';
import WoodenShelfQR from '../designs/Wooden-Display-Shelf-AR-QR-Code.jpg';


import WhiteRoundTableImg from '../designs/pro6.1.jpg';
import WhiteRoundTableQR from '../designs/White-Round-Coffee-Table-3D-Model.jpg';


import ArmchairImg from '../designs/pro7.3.jpg';
import ArmchairQR from '../designs/Modern-Wooden-Armchair-AR-QR-Code.jpg'; 


function FurnitureCustomizer() {
  // Add correct AR/3D viewer URLs for each product
  const furnitureList = [
    {
      name: 'Dining Chair',
      img: ChairImg,
      qr: ChairQR,
      modelUrl: '/bistro.html', // replace with your real URL
    },
    {
      name: 'Shelf Unit',
      img: ShelfImg,
      qr: ShelfQR,
      modelUrl: '/shelf.html',
    },
    {
      name: 'Coffee Table (Art)',
      img: CoffeeTableImg,
      qr: CoffeeTableQR,
      modelUrl: '/coffee.html',
    },
    {
      name: 'Wooden Shelf',
      img: WoodenShelfImg,
      qr: WoodenShelfQR,
      modelUrl: '/armchair.html',
    },
    {
      name: 'White Round Coffee Table',
      img: WhiteRoundTableImg,
      qr: WhiteRoundTableQR,
      modelUrl: '/box viewer.html',
    },
    {
      name: 'Wooden Armchair',
      img: ArmchairImg,
      qr: ArmchairQR,
      modelUrl: '/armchair.html',
    },
  ];


  return (
    // Outer container fills the screen vertically
    <div className="flex flex-col h-screen relative font-sans">
      
      {/* Product Catalog Section - takes up full width and height */}
      <div className="w-full h-full bg-white p-10 flex flex-col">
        <h1 className="text-3xl text-purple-800 font-extrabold mb-8 text-center border-b pb-4">
          Interactive Furniture Catalog
        </h1>
        
        {/* Grid container set to 3 columns, forcing a 3x2 layout for 6 products */}
        <div className="grid grid-cols-3 gap-10 overflow-y-auto">
          {furnitureList.map((f, idx) => (
            <div 
              key={idx} 
              // Increased p-4 to p-6 for better spacing
              className="flex flex-col items-center border border-gray-200 rounded-xl p-6 shadow-xl bg-white hover:shadow-2xl transition duration-300 transform hover:scale-[1.02]"
            >
              <img
                src={f.img}
                alt={f.name}
                // ***CHANGE HERE: Increased max-height from max-h-48 to max-h-64 (h-64) for clearer product visibility***
                className="w-full h-auto max-h-64 object-cover rounded-lg shadow-md mb-4"
              />
              <span className="text-xl font-bold text-gray-900 mt-2 text-center leading-snug">{f.name}</span>
              
              <div className="flex gap-4 justify-center items-center mt-5">
                <a
                  href={f.modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full text-base font-medium shadow-md transition whitespace-nowrap"
                >
                  View in 3D
                </a>
                <img
                  src={f.qr}
                  alt={`${f.name} QR`}
                  // QR code size remains large for scanning
                  className="w-24 h-24 rounded border border-gray-300 p-1" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}


export default FurnitureCustomizer;
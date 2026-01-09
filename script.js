document.addEventListener('DOMContentLoaded', function () {
    // ============ THREE.JS - CÓDIGO FUNCIONAL ============
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById("container");
    container.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xFFFFFF, 1);
    scene.add(light);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const textures = [
        textureLoader.load('imagenes/A.JPG'),
        textureLoader.load('imagenes/B.JPG'),
        textureLoader.load('imagenes/C.JPG'),
        textureLoader.load('imagenes/D.JPG')
    ];

    let currentScene = 0;
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: textures[currentScene] });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.set(0, 0, 3);

    function nextImage() {
        currentScene++;
        if (currentScene >= textures.length) currentScene = 0;
        material.map = textures[currentScene];
        material.needsUpdate = true;
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // ============ CARRITO ============
    let nightsCount = 0;
    let carritoAbierto = false;
    
    // Inicializar contador en 0
    updateNightsCount();

    function updateNightsCount() {
        const nightsCountElement = document.getElementById('cart-count');
        const cartBadge = document.getElementById('cart-badge');
        
        if (nightsCountElement) {
            nightsCountElement.textContent = nightsCount;
        }
        
        if (cartBadge) {
            cartBadge.textContent = nightsCount > 0 ? '1' : '0';
        }
    }

    // Función para abrir/cerrar carrito
    function toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const openCartBtn = document.getElementById('open-cart');
        
        if (cartSidebar.style.right === '0px') {
            cartSidebar.style.right = '-350px';
            openCartBtn.textContent = 'Abrir Carrito';
            carritoAbierto = false;
        } else {
            cartSidebar.style.right = '0';
            openCartBtn.textContent = 'Cerrar Carrito';
            carritoAbierto = true;
        }
    }

    // Event listeners para el carrito
    document.getElementById('open-cart').addEventListener('click', toggleCart);
    
    document.getElementById('nav-cart-link').addEventListener('click', function(e) {
        e.preventDefault();
        toggleCart();
    });

    // Botón agregar al carrito
    document.getElementById('add-to-cart').addEventListener('click', function() {
        if (nightsCount > 0) {
            alert(`✅ Reserva agregada al carrito!\n\n📅 ${nightsCount} noches\n💰 Total: $${(nightsCount * 50000).toLocaleString('es-CL')} CLP\n\nPuedes continuar explorando nuestros departamentos.`);
            localStorage.setItem('reserva', JSON.stringify({
                noches: nightsCount,
                total: nightsCount * 50000,
                fecha: new Date().toISOString()
            }));
        } else {
            alert("📅 Por favor selecciona fechas válidas primero.");
        }
    });

    // ============ CONTROL DEL ESPACIO ============
    document.getElementById('next-image').addEventListener('click', nextImage);
    
    window.addEventListener('keydown', function(event) {
        if (event.key === ' ') {
            event.preventDefault();
            
            const isDateInput = event.target.id === 'check-in' || event.target.id === 'check-out';
            
            if (!isDateInput && !carritoAbierto) {
                nextImage();
            } else if (isDateInput) {
                return;
            } else {
                event.preventDefault();
            }
        }
    });

    // ============ FLATPICKR ============
    flatpickr("#check-in", {
        locale: "es",
        minDate: "today",
        maxDate: "2026-12-31",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            updateTotalPrice();
        }
    });

    flatpickr("#check-out", {
        locale: "es",
        minDate: "today",
        maxDate: "2026-12-31",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr, instance) {
            updateTotalPrice();

            const checkInDate = document.getElementById("check-in").value;
            if (checkInDate) {
                const checkIn = new Date(checkInDate);
                const checkOut = new Date(dateStr);

                if (checkOut < checkIn) {
                    alert("⚠️ ¡CUIDADO!\nLa fecha de check-out debe ser posterior a la de check-in.");
                    document.getElementById("check-out").value = "";
                    nightsCount = 0;
                    updateNightsCount();
                    document.getElementById("total-price").textContent = "Total: $ 0 CLP";
                }
            }
        }
    });

    // Función para actualizar precio
    function updateTotalPrice() {
        const checkInDate = document.getElementById("check-in").value;
        const checkOutDate = document.getElementById("check-out").value;

        // Resetear si no hay fechas válidas
        if (!checkInDate || !checkOutDate) {
            nightsCount = 0;
            updateNightsCount();
            document.getElementById("total-price").textContent = "Total: $ 0 CLP";
            return;
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        const differenceInTime = checkOut - checkIn;
        const numberOfNights = differenceInTime / (1000 * 3600 * 24);

        if (numberOfNights === 0) {
            nightsCount = 1;
        } else if (numberOfNights <= 0) {
            alert("⚠️ ¡CUIDADO!\nLa fecha de check-out debe ser posterior a la de check-in.");
            nightsCount = 0;
        } else {
            nightsCount = numberOfNights;
        }

        updateNightsCount();

        const pricePerNight = 50000;
        const totalPrice = nightsCount * pricePerNight;

        document.getElementById("total-price").textContent = `Total: $ ${totalPrice.toLocaleString('es-CL')} CLP`;
    }
    
    // ============ LIMPIAR RESERVA ANTERIOR AL CARGAR ============
    // Verificar si hay fechas en los inputs, si no, resetear todo
    function resetearCarritoSiVacio() {
        const checkInDate = document.getElementById("check-in").value;
        const checkOutDate = document.getElementById("check-out").value;
        
        if (!checkInDate || !checkOutDate) {
            nightsCount = 0;
            updateNightsCount();
            document.getElementById("total-price").textContent = "Total: $ 0 CLP";
        }
    }
    
    // Ejecutar al cargar y después de cargar localStorage
    setTimeout(() => {
        resetearCarritoSiVacio();
    }, 100);
    
    // Opcional: limpiar localStorage si quieres empezar fresco
    // localStorage.removeItem('reserva');
});
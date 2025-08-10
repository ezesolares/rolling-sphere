# Cálculo y visualización de áreas de protección

Este documento profundiza en cómo el proyecto implementa el **método de la esfera rodante** descrito en la norma IEC 62305‑2. La explicación está pensada para alguien que se acerca por primera vez al concepto, por lo que se parte de los principios básicos y se avanza hasta la descripción del código.

## ¿Qué es el método de la esfera rodante?

Imaginemos que disponemos de una esfera de gran tamaño cuyo radio depende del nivel de protección que se quiere conseguir (por ejemplo 30 m para un nivel I). Se "hace rodar" esta esfera alrededor de la estructura a proteger. Cualquier punto que pueda tocar la esfera se considera **no protegido** porque un rayo podría alcanzar ese mismo punto. Los lugares donde la esfera queda apoyada únicamente en los pararrayos delimitan el volumen que sí está protegido.

En este proyecto simulamos ese proceso de forma digital: calculamos todas las posiciones posibles de la esfera apoyada en los pararrayos y dibujamos la envolvente que queda por debajo.

## Arquitectura general

- **`src/index.js`** – Punto de entrada de la aplicación. Configura Three.js (escena, cámara y controles) y crea algunos objetos de ejemplo: pararrayos, edificio y la esfera imaginaria utilizada en los cálculos.
- **`src/elements/Objects.js`** – Almacena referencias a todos los objetos de la escena. Aquí se identifican los pararrayos (`isRod`) y la representación de la esfera (`sphere`).
- **`src/elements/Protection.js`** – Implementa el algoritmo del método de la esfera rodante: calcula curvas, genera superficies y añade todo al escenario.
- **`src/functions/Util.js`** – Conjunto de utilidades matemáticas. Incluye funciones para obtener puntos de contacto de la esfera, profundidades de penetración, distancias y puntos medios.
- **`src/elements/protective_objects/ProtectiveCone.js`** – Construye los conos que visualizan la superficie de la esfera en cada punto de apoyo.

## Flujo de cálculo explicado paso a paso

1. **Inicio del cálculo** – Desde la interfaz gráfica se ejecuta `calculateProtection()` (en `Protection.js`). Lo primero que hace es borrar cualquier cálculo anterior para empezar desde cero.
2. **Recorrido de pararrayos** – Se toma cada par de pararrayos y se comprueba si una esfera de radio `sphere.radius` puede tocar ambos a la vez. El cálculo se realiza con la función `penetrationDepth` de `Util.js`. Si la esfera es demasiado pequeña para abarcar la distancia entre ambos pararrayos, el par se descarta.
3. **Curva parabólica entre pararrayos** – Para cada par válido se determina la trayectoria que seguiría el centro de la esfera al rodar desde el primer pararrayos hasta el segundo. Esta trayectoria tiene forma de **parábola** y se aproxima mediante `QuadraticBezierCurve3` de Three.js.
4. **Generación de conos** – A lo largo de la curva se escogen varios puntos (según la granulación definida) y en cada punto se crea un cono mediante `ProtectiveCone.getMeshFor`. El cono no es un elemento físico real, simplemente representa la porción de esfera que toca la curva en ese punto para facilitar la visualización.
5. **Almacenamiento de líneas de puntos** – Los puntos de cada curva se almacenan también como líneas. Posteriormente, estas líneas servirán para saber qué curvas se tocan entre sí y poder cerrar superficies.
6. **Construcción de superficies** – Cuando se encuentran tres curvas que unen a tres pararrayos formando un triángulo, `drawFaces()` se encarga de rellenar el espacio entre ellas creando cuadriláteros y triángulos curvados (`drawSquareLike` y `drawTriangleLike`). El resultado final es un "paraguas" protector continuo.
7. **Visualización** – Todas las geometrías calculadas (conos, líneas y superficies) se añaden a la escena con materiales semitransparentes para apreciar cómo la esfera imaginaria envuelve la estructura.

## Matemática clave

El punto esencial del método es calcular cuánto debe bajar el centro de la esfera para tocar dos pararrayos separados una distancia `d`. Esa cantidad se conoce como **profundidad de penetración** `p` y viene dada por:

\[
p = r - \sqrt{r^2 - \left(\frac{d}{2}\right)^2}
\]

donde `r` es el radio de la esfera. Si `d` es mayor que el diámetro de la esfera (`2r`), la raíz cuadrada se vuelve imaginaria, lo que en el código se traduce en `null` y significa que la esfera no puede tocar ambos pararrayos a la vez.

Este valor `p` se usa constantemente para ajustar la altura de puntos intermedios cuando se construyen las curvas y superficies. Gracias a ello, ninguna parte del volumen protector queda por encima de la esfera rodante.

## Presentación y materiales

El resultado se representa con materiales semitransparentes (`yellowTransparentMaterial`) para permitir ver el interior del volumen protector. Los conos muestran dónde la esfera toca a los pararrayos, las líneas representan la trayectoria del centro de la esfera y las superficies amarillas rellenan los huecos entre curvas.

Al manipular la escena se puede observar de forma intuitiva cómo el tamaño y la disposición de los pararrayos condicionan el volumen que queda protegido frente a impactos directos de rayo.


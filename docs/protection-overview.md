# Cálculo y visualización de áreas de protección

Este documento describe cómo el proyecto implementa el **método de la esfera rodante** según la norma IEC 62305‑2 y cómo se relacionan los distintos módulos del código.

## Arquitectura general

- **`src/index.js`** inicializa la escena de Three.js, la cámara y los controles de usuario. También crea objetos de prueba (pararrayos y volúmenes a proteger) y añade el *renderer* al DOM.
- **`src/elements/Objects.js`** mantiene un registro de todos los elementos presentes en la escena. En particular expone los pararrayos (`isRod`) y la esfera imaginaria utilizada para los cálculos (`sphere`).
- **`src/elements/Protection.js`** contiene el algoritmo principal que calcula y dibuja las zonas protegidas utilizando la esfera rodante.
- **`src/functions/Util.js`** agrupa funciones matemáticas auxiliares como el cálculo de la penetración de la esfera o de puntos medios.
- **`src/elements/protective_objects/ProtectiveCone.js`** genera las geometrías cónicas que representan la superficie tangente de la esfera en cada punto de la envolvente.

## Flujo de cálculo

1. Desde la interfaz se llama a `calculateProtection()` (`Protection.js`). Esta función limpia cualquier cálculo previo y ejecuta `protection()`.
2. `protection()` recorre todos los pares de pararrayos y determina si una esfera de radio `sphere.radius` puede tocar ambos simultáneamente (`penetrationDepth`). Si es posible, se construye una **curva cuadrática** entre los puntos superiores de ambos pararrayos. Esta curva representa la trayectoria del centro de la esfera rodante.
3. A lo largo de dicha curva se generan conos mediante `ProtectiveCone.getMeshFor`, que visualmente muestran la superficie de la esfera. Cada conjunto de puntos se almacena también como una línea para poder cerrar superficies entre varias curvas.
4. Cuando existen tres líneas que forman un triángulo, `drawFaces()` conecta las curvas mediante superficies cuadriláteras y triangulares (`drawSquareLike` y `drawTriangleLike`), creando así un “paraguas” protector continuo.
5. Todas las geometrías creadas se añaden a la escena para su visualización.

## Matemática clave

El corazón del método está en la función `penetrationDepth` (`Util.js`), que calcula cuánto debe descender el centro de la esfera cuando toca dos pararrayos separados una distancia `d`:

\[ p = r - \sqrt{r^2 - \left(\frac{d}{2}\right)^2} \]

Este valor `p` se utiliza para ajustar la altura de los puntos intermedios en las curvas y superficies, garantizando que la esfera tangente no intercepte la estructura protegida.

## Presentación

El resultado se renderiza con materiales semitransparentes (`yellowTransparentMaterial`) para observar la intersección entre la envolvente de protección y los elementos de la escena. Cada cono y cara generada corresponde a una posición potencial de la esfera rodante.


// Este módulo construye visualmente el volumen protegido aplicando el
// **método de la esfera rodante**. La idea básica es imaginar una
// esfera que se apoya en los pararrayos y "rueda" alrededor de la
// estructura. Cualquier zona que pueda ser tocada por la esfera se
// considera expuesta al rayo; por tanto el volumen protegido es el
// espacio que queda por debajo de la esfera. A partir de los pararrayos
// definidos en `Objects.js` se calcula la envolvente que una esfera
// imaginaria de radio `sphere.radius` puede tocar sin interceptar la
// estructura protegida.

import { objects, sphere } from './Objects'
import { scene } from '../index'
import { redMaterial, yellowTransparentMaterial } from './Materials'
import {
    Face3,
    Geometry,
    Line,
    Mesh,
    QuadraticBezierCurve3,
    SphereGeometry,
    Triangle,
    Vector3,
} from 'three'
import { distance, midpointVector3, penetrationDepth } from '../functions/Util'
import { ProtectiveCone } from './protective_objects/ProtectiveCone'

let protections = []
let lines = []
let helpPoints = []

export function calculateProtection () {
  // Punto de entrada público.  Limpia cualquier geometría previa y
  // recalcula las zonas protegidas.
  clearProtection()
  protection()
}

export function clearProtection () {
  if (protections && protections.length) {
    protections.forEach(p => scene.remove(p))
  }
}

export function protection () {
  // Inicialización: eliminar cualquier superficie existente y
  // preparar estructuras temporales.
  if (protections && protections.length) {
    protections.forEach(p => scene.remove(p))
  }
  lines = []
  helpPoints = []
  protections = []

  // La "granulación" define cuántos puntos se emplean para aproximar
  // cada curva. A mayor número, más suave será la superficie pero más
  // costoso será el cálculo.
  let granulation = 20

  // Filtramos únicamente los objetos que actúan como pararrayos.
  let rods = objects.filter(o => o.isRod)
  // Recorremos todas las combinaciones posibles de dos pararrayos. Para
  // cada pareja se comprobará si una esfera puede apoyarse en ambos a la
  // vez.
  for (let mainIdx = 0; mainIdx < (rods.length - 1); mainIdx++) {
    let co = rods[mainIdx]
    for (let secIdx = (mainIdx + 1); secIdx < rods.length; secIdx++) {
      let o = rods[secIdx]
      // Verificamos si la esfera de radio `sphere.radius` puede tocar
      // ambos pararrayos simultáneamente. Si la distancia es demasiado
      // grande `penetrationDepth` devuelve `null` y se ignora el par. En
      // caso contrario, se calcula la curva protectora entre ellos.
      let depth = penetrationDepth(sphere.radius, distance(co, o))
      if (depth) {

        // Punto superior de protección de cada pararrayos (punta del
        // mástil más la altura normativa).
        let p1 = co.getProtectivePoint()
        let p2 = o.getProtectivePoint()
        // Punto medio entre ambos pararrayos.
        let m = midpointVector3(p1, p2)
        let distance = p1.distanceTo(p2)
        // Desplazamos el punto medio hacia abajo según la penetración
        // de la esfera para obtener el vértice de la parábola.
        let penetration = penetrationDepth(sphere.radius, distance)
        m.y = m.y - penetration
        let p3 = new Vector3(m.x, m.y, m.z)
        p3.y = p3.y - penetration
        // Con estos tres puntos (inicio, vértice y final) generamos una
        // curva parabólica que describe el recorrido del centro de la
        // esfera al moverse de un pararrayos al otro.
        let points = new QuadraticBezierCurve3(p1, p3, p2).getPoints(
          granulation)

        // En cada punto de la curva generamos un "cono" protector que
        // representa la superficie tangente de la esfera rodante. El
        // conjunto de todos esos conos da una idea intuitiva de cómo la
        // esfera cubre la zona.
        points.forEach(p => {
          let cone = ProtectiveCone.getMeshFor(p, sphere.radius, 4,
            yellowTransparentMaterial)
          protections.push(cone)

        })
        // También almacenamos la línea de puntos. Más adelante se
        // compararán estas líneas para detectar triángulos y poder
        // cerrar superficies entre distintas curvas.
        let geometry = new Geometry()
        geometry.vertices = points
        let line = new Line(geometry, redMaterial)
        line.start = geometry.vertices[0]
        line.end = geometry.vertices[granulation]
        lines.push(line)
      }
    }

  }
  // Una vez calculadas las líneas, buscamos grupos de tres que formen un
  // triángulo. Cada triángulo indica que la esfera puede apoyarse en los
  // tres pararrayos correspondientes y por tanto existe una superficie
  // cerrada entre ellos.
  let triangles = []
  for (let fi = 0; fi < lines.length; fi++) {
    let l1 = lines[fi]
    l1.neighbors = []
    // "Buscar vecinos": líneas que comparten algún extremo con l1.
    for (let i = 0; i < lines.length; i++) {
      if (fi !== i) {
        let l2 = lines[i]
        if (sameStart(l1, l2) || sameEnd(l1, l2) || startEqualEnd(l1, l2) ||
          startEqualEnd(l2, l1)) {
          l1.neighbors.push(l2)
        }
      }
    }
    // "Buscar triángulos": comprobamos si alguno de los vecinos se une a
    // un tercer vecino que a su vez vuelve a l1, formando así un lazo de
    // tres líneas.
    l1.neighbors.forEach(n1 => {
      if (n1.neighbors) {
        n1.neighbors.forEach(n2 => {
          if (n2 !== l1 && n2.neighbors) {
            n2.neighbors.forEach(n3 => {
              if (n3 === l1) {
                let isT = isTriangle(n1, n2, n3)
                if (isT) {
                  // Ordenamos los identificadores para poder detectar
                  // triángulos repetidos independientemente del orden en
                  // el que se encuentren.
                  let tri = [n1, n2, n3].sort((a, b) => {
                    let x = a.uuid
                    let y = b.uuid
                    return x < y ? -1 : x > y ? 1 : 0
                  })

                  let alreadyExists = triangles.some(e => {
                    return e[0] === tri[0] && e[1] === tri[1] && e[2] ===
                      tri[2]
                  })

                  if (!alreadyExists) {
                    triangles.push(tri)
                  }
                }
              }
            })
          }
        })
      }
    })
  }
  console.log(triangles.length)
  for (let i = 0; i < triangles.length; i++) {
    drawFaces(triangles[i], granulation)
  }

  protections.forEach(up => {
    scene.add(up)
  })
}

// A partir de tres líneas curvas (que unen pares de pararrayos) se
// construyen superficies que las cierran para formar un "paraguas"
// protector.
function drawFaces (triangle, granulation) {

  let l1 = triangle[0]
  let l2 = triangle[1]
  let l3 = triangle[2]
  drawToHalfOfLine(l1, l2, granulation)
  drawToHalfOfLine(l1, l3, granulation)
  drawToHalfOfLine(l3, l2, granulation)

  // Finalmente cerramos el centro del triángulo con una superficie
  // triangular calculada a partir de los puntos medios de cada línea.
  let middleId = granulation / 2
  let tri = drawTriangleLike(l1.geometry.vertices[middleId],
    l2.geometry.vertices[middleId], l3.geometry.vertices[middleId],
    granulation)
  protections.push(tri)

}

// Dibuja superficies cuadriláteras entre dos curvas hasta la mitad de su
// longitud. Repetido para cada par de líneas de un triángulo, va
// cerrando progresivamente la envolvente protectora.
function drawToHalfOfLine (l1, l2, granulation) {

  let l1p = l1.geometry.vertices.slice()
  let l2p = l2.geometry.vertices.slice()
  if (sameStart(l1, l2)) {
    // ambas líneas tienen el mismo origen
  } else if (sameEnd(l1, l2)) {
    l1p.reverse()
    l2p.reverse()
  } else if (startEqualEnd(l1, l2)) {
    l2p.reverse()
  } else if (startEqualEnd(l2, l1)) {
    l1p.reverse()
  } else {
    return
  }
  for (let ii = 1; ii < granulation / 2; ii++) {
    protections.push(
      drawSquareLike(l1p[ii], l1p[ii + 1], l2p[ii + 1], l2p[ii]))
  }
  // Cerramos el vértice más cercano a los pararrayos con un triángulo
  let corner = drawTriangle(l1p[0], l1p[1], l2p[1])
  protections.push(corner)
}

// Construye un cuadrilátero curvado interpolando los puntos medios y
// desplazándolos hacia abajo según la penetración de la esfera.
function drawSquareLike (p0, p1, p2, p3) {
  let square = new Geometry()

  // Cálculo de los puntos medios entre los vértices opuestos del
  // cuadrilátero y ajuste vertical por la profundidad de penetración.
  let p0p3 = midpointVector3(p0, p3)
  let distance1 = p0.distanceTo(p3)
  let penetration1 = penetrationDepth(sphere.radius, distance1)
  p0p3.y = p0p3.y - penetration1

  let p1p2 = midpointVector3(p1, p2)
  let distance2 = p1.distanceTo(p2)
  let penetration2 = penetrationDepth(sphere.radius, distance2)
  p1p2.y = p1p2.y - penetration2

  square.vertices.push(p0)
  square.vertices.push(p1)
  square.vertices.push(p2)
  square.vertices.push(p3)

  square.vertices.push(p0p3)
  square.vertices.push(p1p2)

  square.faces.push(new Face3(0, 1, 4))
  square.faces.push(new Face3(1, 4, 5))
  square.faces.push(new Face3(3, 4, 2))
  square.faces.push(new Face3(2, 4, 5))

  yellowTransparentMaterial.side = 2
  return new Mesh(square, yellowTransparentMaterial)

}

// Similar a `drawSquareLike` pero creando una superficie triangular
// curvada que se utiliza para cerrar el centro entre tres curvas.
function drawTriangleLike (p0, p1, p2) {
  let triangle = new Geometry()

  let p3 = midpointVector3(p0, p1)
  let distance3 = p0.distanceTo(p1)
  let penetration3 = penetrationDepth(sphere.radius, distance3)
  p3.y = p3.y - penetration3

  let p4 = midpointVector3(p1, p2)
  let distance4 = p1.distanceTo(p2)
  let penetration4 = penetrationDepth(sphere.radius, distance4)
  p4.y = p4.y - penetration4

  let p5 = midpointVector3(p2, p0)
  let distance5 = p2.distanceTo(p0)
  let penetration5 = penetrationDepth(sphere.radius, distance5)
  p5.y = p5.y - penetration5

  triangle.vertices.push(p0)
  triangle.vertices.push(p1)
  triangle.vertices.push(p2)
  triangle.vertices.push(p3)
  triangle.vertices.push(p4)
  triangle.vertices.push(p5)

  triangle.faces.push(new Face3(0, 3, 5))
  triangle.faces.push(new Face3(1, 3, 4))
  triangle.faces.push(new Face3(2, 4, 5))
  triangle.faces.push(new Face3(3, 4, 5))

  yellowTransparentMaterial.side = 2
  return new Mesh(triangle, yellowTransparentMaterial)
}

function drawTriangle (p0, p1, p2) {
  let triangle = new Geometry()
  triangle.vertices.push(p0)
  triangle.vertices.push(p1)
  triangle.vertices.push(p2)
  triangle.faces.push(new Face3(0, 1, 2))
  yellowTransparentMaterial.side = 2
  return new Mesh(triangle, yellowTransparentMaterial)
}

// Comprueba si dos líneas comparten el mismo punto de inicio.
function sameStart (l1, l2) {
  return l1.start.equals(l2.start)
}

// Comprueba si el inicio de una línea coincide con el final de otra.
function startEqualEnd (l1, l2) {
  return l1.start.equals(l2.end)
}

// Comprueba si dos líneas terminan en el mismo punto.
function sameEnd (l1, l2) {
  return l1.end.equals(l2.end)
}

// A partir de tres líneas devuelve el triángulo geométrico que forman.
function toTriangle (lines) {

  let vertices = []
  lines.forEach(line => {
    vertices.push(line.start)
    vertices.push(line.end)
  })
  let unique = []
  vertices.forEach(v => {
    let contains = unique.some(x => {
      return v.equals(x)
    })
    if (!contains) {
      unique.push(v)
    }
  })
  return new Triangle(unique[0], unique[1], unique[2])
}

// Determina si tres líneas conectadas forman un triángulo cerrado.
function isTriangle (l1, l2, l3) {
  if (sameStart(l1, l2)) {
    if (sameEnd(l1, l3) && startEqualEnd(l3, l2)) {
      return true
    }
    if (sameEnd(l2, l3) && startEqualEnd(l3, l1)) {
      return true
    }
  } else if (sameEnd(l1, l2)) {
    if (sameStart(l1, l3) && startEqualEnd(l2, l3)) {
      return true
    }
    if (sameStart(l2, l3) && startEqualEnd(l1, l3)) {
      return true
    }
  } else if (startEqualEnd(l1, l2)) {
    if (sameEnd(l1, l3) && sameStart(l2, l3)) {
      return true
    }
    if (startEqualEnd(l3, l1) && startEqualEnd(l2, l3)) {
      return true
    }
  } else if (startEqualEnd(l2, l1)) {
    if (sameStart(l1, l3) && sameEnd(l2, l3)) {
      return true
    }
    if (startEqualEnd(l1, l3) && startEqualEnd(l3, l2)) {
      return true
    }
  }
  return false
}

function createPointVisual (v) {
  // Utilidad de depuración: dibuja una pequeña esfera roja en `v` para
  // poder inspeccionar visualmente puntos clave del algoritmo.
  let sg = new SphereGeometry(0.05, 10, 10)
  let s = new Mesh(sg, redMaterial)
  s.position.x = v.x
  s.position.y = v.y
  s.position.z = v.z
  helpPoints.push(s)
}




import { Vector2, Vector3 } from 'three'

  module.exports = {
    // A partir de la altura `heightOfRightTriangle` calcula la longitud de
    // la base de un triángulo rectángulo inscrito en una esfera. Se usa
    // para obtener el radio de la circunferencia que describe la esfera en
    // el plano del suelo.
    basisOfRightTriangleBasedOnSphereOnGroundPoint (
      radiusOfSphere, heightOfRightTriangle) {
      let rMinusH = radiusOfSphere - heightOfRightTriangle
      return Math.sqrt((radiusOfSphere * radiusOfSphere) - (rMinusH * rMinusH))
    },

    // Construye los puntos del perfil de la esfera que tocan el suelo a la
    // altura `maxHeight`. El resultado es un conjunto de coordenadas 2D que
    // luego se girarán para generar un cono mediante `LatheGeometry`.
    calculateContactPoints (maxHeight, radiusOfSphere, segments) {
      let points = [new Vector2(0, maxHeight)]
      let heightDelta = maxHeight / segments
      let maxBase = module.exports.basisOfRightTriangleBasedOnSphereOnGroundPoint(
        radiusOfSphere, maxHeight)
      for (let currHeight = maxHeight - heightDelta; currHeight >
      0; currHeight -= heightDelta) {
        let base = module.exports.basisOfRightTriangleBasedOnSphereOnGroundPoint(
          radiusOfSphere, currHeight)
        points.push(new Vector2((maxBase - base), currHeight))
      }
      // Finalmente se añade el punto donde la esfera toca el suelo.
      points.push(new Vector2(maxBase, 0))
      return points
    },
    // Devuelve los `numberOfNeighbours` objetos más próximos al objeto
    // dado. Se utiliza para encontrar qué pararrayos están cerca entre sí.
    nearestNeighbours (object, objects, numberOfNeighbours) {
    let position = object.position
    let distances = []
    objects.forEach(o => {
      distances.push({
        distance: position.distanceTo(o.position),
        object: o,
      })
    })
    return distances.sort((o1, o2) => o1.distance - o2.distance).
      map(o => o.object).
      slice(0, numberOfNeighbours + 1)
  },
    // Versión vectorizada de la función anterior: para cada objeto del
    // array calcula sus vecinos más cercanos.
    nearestNeighboursOfEach (objects, numberOfNeighbours) {
      let neighbours = []
      objects.forEach(o => {
        let n = module.exports.nearestNeighbours(o, objects, numberOfNeighbours)
        neighbours.push(n)
      })
      return neighbours
    },
  // Distancia euclídea entre dos objetos Three.js.
  distance (object1, object2) {
    return object1.position.distanceTo(object2.position)
  },
    // Profundidad de penetración de una esfera apoyada en dos puntos
    // separados `distanceBetween`. Corresponde a la fórmula:
    //   p = r - sqrt(r^2 - (d/2)^2)
    // donde `r` es el radio de la esfera y `d` la distancia entre los
    // puntos de apoyo. Si `d` supera el diámetro de la esfera no hay
    // contacto y se devuelve `null`.
    penetrationDepth (radiusOfSphere, distanceBetween) {
      if (radiusOfSphere * 2 < distanceBetween) {
        return null
      }
      return radiusOfSphere -
        Math.sqrt(Math.pow(radiusOfSphere, 2) - Math.pow(distanceBetween / 2, 2))
    },
    // Altura de un casquete esférico en función del radio de la esfera y
    // del radio de la base del casquete.
    heightOfSphericalSector (radiusOfSphere, radiusOfSphereSectorBase) {
      return radiusOfSphere - Math.sqrt((radiusOfSphere * radiusOfSphere) -
        (radiusOfSphereSectorBase * radiusOfSphereSectorBase))
    },

    // A partir de un triángulo rectángulo devuelve el radio del círculo
    // que lo circunscribe. Útil para convertir medidas lineales en
    // parámetros esféricos.
    radiusOfSphereSectorBaseFromRightTriangle (
      heightOfRightTriangle, baseOfRightTriangle) {
      return Math.sqrt(((heightOfRightTriangle * heightOfRightTriangle) +
        (baseOfRightTriangle * baseOfRightTriangle)) / 4)
    },

    // Radio de la base de un casquete esférico conocido su altura.
    radiusOfSphericalSectorBase (radiusOfSphere, heightOfSphericalSector) {
      return Math.sqrt(
        (2 * radiusOfSphere - heightOfSphericalSector) * heightOfSphericalSector)
    },

  // Punto medio entre dos `Vector3`.
  midpointVector3 (vertex1, vertex2) {
    return new Vector3(((vertex1.x + vertex2.x) / 2),
      ((vertex1.y + vertex2.y) / 2), ((vertex1.z + vertex2.z) / 2))
  },
}
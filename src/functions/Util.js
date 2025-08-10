import { Vector2, Vector3 } from 'three'

module.exports = {
  // Obtiene la longitud de la base de un triángulo rectángulo cuyos
  // catetos representan la distancia horizontal entre el punto de
  // contacto de la esfera y el suelo.
  basisOfRightTriangleBasedOnSphereOnGroundPoint (
    radiusOfSphere, heightOfRightTriangle) {
    let rMinusH = radiusOfSphere - heightOfRightTriangle
    return Math.sqrt((radiusOfSphere * radiusOfSphere) - (rMinusH * rMinusH))
  },

  // Calcula los puntos del perfil generado por una esfera de radio
  // `radiusOfSphere` tangente al suelo a una altura `maxHeight`.
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
    points.push(new Vector2(maxBase, 0))
    return points
  },
  // Utilidades geométricas complementarias.
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
  // Profundidad de penetración de una esfera de radio `radiusOfSphere`
  // apoyada simultáneamente en dos puntos separados `distanceBetween`.
  // Si la distancia es mayor que el diámetro de la esfera no existe
  // intersección y se devuelve `null`.
  penetrationDepth (radiusOfSphere, distanceBetween) {
    if (radiusOfSphere * 2 < distanceBetween) {
      return null
    }
    return radiusOfSphere -
      Math.sqrt(Math.pow(radiusOfSphere, 2) - Math.pow(distanceBetween / 2, 2))
  },
  heightOfSphericalSector (radiusOfSphere, radiusOfSphereSectorBase) {
    return radiusOfSphere - Math.sqrt((radiusOfSphere * radiusOfSphere) -
      (radiusOfSphereSectorBase * radiusOfSphereSectorBase))
  },

  radiusOfSphereSectorBaseFromRightTriangle (
    heightOfRightTriangle, baseOfRightTriangle) {
    return Math.sqrt(((heightOfRightTriangle * heightOfRightTriangle) +
      (baseOfRightTriangle * baseOfRightTriangle)) / 4)
  },

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
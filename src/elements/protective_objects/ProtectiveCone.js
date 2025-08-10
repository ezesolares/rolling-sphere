import { LatheGeometry, Mesh, SplineCurve } from 'three'
import { calculateContactPoints } from '../../functions/Util'

/**
 * Utilidad para generar un cono de protección.  El cono representa la
 * porción visible de la esfera rodante cuando se apoya en un punto
 * determinado (`peak`). Si imaginamos la esfera tocando el suelo en ese
 * punto, el contorno resultante al girar ese perfil produce un cono.
 * Cada cono es por tanto una instantánea del contacto de la esfera con la
 * superficie protectora.
 */
export class ProtectiveCone {

    /**
     * Calcula la geometría rotacional del cono. Primero se obtiene un
     * perfil 2D de la esfera que toca el suelo a la altura `peak.y` usando
     * `calculateContactPoints`. Después ese perfil se hace girar 360° con
     * `LatheGeometry` para obtener el volumen del cono.
     */
  static calculateGeometryFor (peak, radiusOfSphere, segments) {
    let points = calculateContactPoints(peak.y, radiusOfSphere, segments)
    return new LatheGeometry(new SplineCurve(points).getPoints(segments),
      segments)
  }

    /**
     * Devuelve un `Mesh` ya posicionado en la coordenada `peak` listo para
     * añadirse a la escena. Solo se ajustan los ejes X y Z; la altura del
     * cono ya está implícita en la geometría calculada.
     */
  static getMeshFor (peak, radiusOfSphere, segments, material) {
    let mesh = new Mesh(
      this.calculateGeometryFor(peak, radiusOfSphere, segments), material)
    mesh.position.z = peak.z
    mesh.position.x = peak.x
    return mesh
  }
}
import { LatheGeometry, Mesh, SplineCurve } from 'three'
import { calculateContactPoints } from '../../functions/Util'

/**
 * Utilidad para generar un cono de protección.  El cono representa la
 * superficie tangente de la esfera rodante en un punto determinado
 * ("peak").
 */
export class ProtectiveCone {

  /**
   * Calcula la geometría rotacional del cono a partir de los puntos de
   * contacto que describen el perfil de la esfera en dicho punto.
   */
  static calculateGeometryFor (peak, radiusOfSphere, segments) {
    let points = calculateContactPoints(peak.y, radiusOfSphere, segments)
    return new LatheGeometry(new SplineCurve(points).getPoints(segments),
      segments)
  }

  /**
   * Devuelve un `Mesh` posicionado en el lugar correcto para poder ser
   * añadido a la escena.
   */
  static getMeshFor (peak, radiusOfSphere, segments, material) {
    let mesh = new Mesh(
      this.calculateGeometryFor(peak, radiusOfSphere, segments), material)
    mesh.position.z = peak.z
    mesh.position.x = peak.x
    return mesh
  }
}
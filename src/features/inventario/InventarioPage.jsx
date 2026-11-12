
import { useEffect, useMemo, useState } from "react";

import {
  Boxes,
  Plus,
  Search,
  Pencil,
  Power,
  X,
  Check,
  Barcode,
  ChevronDown,
  MapPin,
} from "lucide-react";

import { obtenerCatalogo } from "../../services/catalogoService";

import {
  obtenerInventario,
  crearRegistroInventario,
  editarRegistroInventario,
  cambiarEstadoRegistro,
} from "../../services/inventarioService";

import { ubicacionesAlmacen } from "../../data/ubicaciones";

const formularioInicial = {
  skuId: "",
  sku: "",
  descripcion: "",
  tieneCodigo: false,
  codigo: "",
  codigoReemplazo: "",
  ubicacion: "",
  subdivision: "",
  observacion: "",
};

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function InventarioPage() {
  const [inventario, setInventario] = useState([]);
  const [catalogo, setCatalogo] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaMaterial, setBusquedaMaterial] = useState("");

  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ubicacionMenuAbierto, setUbicacionMenuAbierto] = useState(false);

  const [registroEditando, setRegistroEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [error, setError] = useState("");

  // ==========================================
  // CARGA INICIAL
  // ==========================================

  useEffect(() => {
    setInventario(obtenerInventario());

    const materiales = obtenerCatalogo() || [];

    setCatalogo(
      materiales.filter(
        (material) => material.estado === "Activo"
      )
    );
  }, []);

  // ==========================================
  // BÚSQUEDA DEL INVENTARIO
  // ==========================================

  const inventarioFiltrado = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    if (!termino) return inventario;

    return inventario.filter((registro) =>
      [
        registro.sku,
        registro.descripcion,
        registro.codigo,
        registro.codigoReemplazo,
        registro.ubicacion,
        registro.subdivision,
      ].some((valor) =>
        normalizarTexto(valor).includes(termino)
      )
    );
  }, [inventario, busqueda]);

  // ==========================================
  // BÚSQUEDA DEL CATÁLOGO MAESTRO
  // ==========================================

  const materialesFiltrados = useMemo(() => {
    const termino = normalizarTexto(busquedaMaterial);

    if (!termino) return [];

    return catalogo
      .filter((material) => {
        const descripcion = normalizarTexto(
          material.descripcion
        );

        const sku = normalizarTexto(material.sku);

        return (
          descripcion.startsWith(termino) ||
          sku.startsWith(termino)
        );
      })
      .sort((a, b) =>
        normalizarTexto(a.descripcion).localeCompare(
          normalizarTexto(b.descripcion),
          "es"
        )
      )
      .slice(0, 8);
  }, [catalogo, busquedaMaterial]);

  // ==========================================
  // INDICADORES
  // ==========================================

  const totalActivos = inventario.filter(
    (registro) => registro.estado === "Activo"
  ).length;

  const totalInactivos = inventario.filter(
    (registro) => registro.estado === "Inactivo"
  ).length;

  // ==========================================
  // UBICACIÓN SELECCIONADA
  // ==========================================

  const ubicacionFormulario = ubicacionesAlmacen.find(
    (ubicacion) =>
      ubicacion.nombre === formulario.ubicacion
  );

  // ==========================================
  // ABRIR NUEVO REGISTRO
  // ==========================================

  function abrirNuevoRegistro() {
    setRegistroEditando(null);

    setFormulario({ ...formularioInicial });

    setBusquedaMaterial("");
    setMostrarResultados(false);
    setUbicacionMenuAbierto(false);
    setError("");

    setModalAbierto(true);
  }

  // ==========================================
  // ABRIR EDICIÓN
  // ==========================================

  function abrirEdicion(registro) {
    const tieneCodigo = Boolean(
      registro.codigo?.trim()
    );

    setRegistroEditando(registro);

    setFormulario({
      skuId: registro.skuId,
      sku: registro.sku,
      descripcion: registro.descripcion,

      tieneCodigo,
      codigo: registro.codigo || "",
      codigoReemplazo: tieneCodigo
        ? registro.codigoReemplazo || ""
        : "",

      ubicacion: registro.ubicacion,
      subdivision: registro.subdivision || "",
      observacion: registro.observacion || "",
    });

    setBusquedaMaterial(registro.descripcion);
    setMostrarResultados(false);
    setUbicacionMenuAbierto(false);
    setError("");

    setModalAbierto(true);
  }

  // ==========================================
  // CERRAR MODAL
  // ==========================================

  function cerrarModal() {
    setModalAbierto(false);
    setRegistroEditando(null);

    setFormulario({ ...formularioInicial });

    setBusquedaMaterial("");
    setMostrarResultados(false);
    setUbicacionMenuAbierto(false);
    setError("");
  }

  // ==========================================
  // ACTUALIZAR CAMPOS
  // ==========================================

  function actualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,

      ...(name === "ubicacion"
        ? { subdivision: "" }
        : {}),
    }));

    setError("");
  }

  // ==========================================
  // CAMBIAR RESPUESTA SÍ / NO
  // ==========================================

  function cambiarTieneCodigo(valor) {
    setFormulario((actual) => ({
      ...actual,
      tieneCodigo: valor,

      codigo: valor ? actual.codigo : "",

      codigoReemplazo: valor
        ? actual.codigoReemplazo
        : "",
    }));

    setError("");
  }

  // ==========================================
  // SELECCIONAR MATERIAL
  // ==========================================

  function seleccionarMaterial(material) {
    setFormulario((actual) => ({
      ...actual,
      skuId: material.id,
      sku: material.sku,
      descripcion: material.descripcion,
    }));

    setBusquedaMaterial(material.descripcion);
    setMostrarResultados(false);
    setError("");
  }

  // ==========================================
  // BUSCAR MATERIAL
  // ==========================================

  function cambiarBusquedaMaterial(event) {
    const valor = event.target.value;

    setBusquedaMaterial(valor);
    setMostrarResultados(true);

    setFormulario((actual) => ({
      ...actual,
      skuId: "",
      sku: "",
      descripcion: "",
    }));
  }

  // ==========================================
  // SELECCIONAR UBICACIÓN PERSONALIZADA
  // ==========================================

  function seleccionarUbicacion(ubicacion) {
    setFormulario((actual) => ({
      ...actual,
      ubicacion: ubicacion.nombre,
      subdivision: "",
    }));

    setUbicacionMenuAbierto(false);
    setError("");
  }

  // ==========================================
  // GUARDAR REGISTRO
  // ==========================================

  function guardarRegistro(event) {
    event.preventDefault();
    setError("");

    try {
      if (!formulario.skuId) {
        throw new Error(
          "Debes seleccionar un material del Catálogo Maestro."
        );
      }

      if (!formulario.ubicacion) {
        throw new Error(
          "Debes seleccionar una ubicación."
        );
      }

      if (
        formulario.tieneCodigo &&
        !formulario.codigo.trim()
      ) {
        throw new Error(
          "Debes ingresar el código del repuesto."
        );
      }

      const datos = {
        ...formulario,

        codigo: formulario.tieneCodigo
          ? formulario.codigo.trim()
          : "",

        codigoReemplazo: formulario.tieneCodigo
          ? formulario.codigoReemplazo.trim()
          : "",
      };

      if (registroEditando) {
        const actualizado = editarRegistroInventario(
          registroEditando.id,
          datos
        );

        setInventario(actualizado);
      } else {
        crearRegistroInventario(datos);
        setInventario(obtenerInventario());
      }

      cerrarModal();
    } catch (err) {
      setError(
        err.message || "No se pudo guardar el registro."
      );
    }
  }

  // ==========================================
  // ACTIVAR / DESACTIVAR
  // ==========================================

  function cambiarEstado(id) {
    try {
      const actualizado = cambiarEstadoRegistro(id);
      setInventario(actualizado);
    } catch (err) {
      setError(err.message);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <section className="inventario-page">

      {/* ENCABEZADO */}

      <div className="page-heading">

        <div>
          <span className="page-eyebrow">
            CONTROL OPERATIVO
          </span>

          <h1>Inventario</h1>

          <p>
            Asocia los códigos utilizados en almacén con los
            materiales registrados en el Catálogo Maestro.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={abrirNuevoRegistro}
        >
          <Plus size={19} />
          Nueva asociación
        </button>

      </div>

      {/* INDICADORES */}

      <div className="summary-grid">

        <article className="summary-card">
          <span>Asociaciones</span>
          <strong>{inventario.length}</strong>
          <small>Registros totales</small>
        </article>

        <article className="summary-card">
          <span>Activos</span>
          <strong>{totalActivos}</strong>
          <small>Registros disponibles</small>
        </article>

        <article className="summary-card">
          <span>Inactivos</span>
          <strong>{totalInactivos}</strong>
          <small>Registros deshabilitados</small>
        </article>

      </div>

      {/* TABLA */}

      <div className="content-card">

        <div className="table-toolbar">

          <div>
            <h2>Inventario registrado</h2>

            <p>
              Identificación de materiales y su ubicación física.
            </p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Buscar material, SKU, código o ubicación..."
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
            />
          </div>

        </div>

        <div className="table-wrapper">

          <table className="data-table inventory-table">

            <thead>
              <tr>
                <th>SKU</th>
                <th>Material</th>
                <th>Código</th>
                <th>Reemplazo</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {inventarioFiltrado.map((registro) => (

                <tr key={registro.id}>

                  <td>
                    <span className="sku-code">
                      {registro.sku}
                    </span>
                  </td>

                  <td>
                    <strong>{registro.descripcion}</strong>
                  </td>

                  <td>
                    <span className="external-code">
                      {registro.codigo || "Sin código"}
                    </span>
                  </td>

                  <td>
                    {registro.codigoReemplazo || "—"}
                  </td>

                  <td>
                    <span className="location-badge">
                      {registro.ubicacion}

                      {registro.subdivision
                        ? ` · ${registro.subdivision}`
                        : ""}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        registro.estado === "Activo"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {registro.estado}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">

                      <button
                        type="button"
                        className="icon-action"
                        title="Editar asociación"
                        onClick={() => abrirEdicion(registro)}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="icon-action"
                        title={
                          registro.estado === "Activo"
                            ? "Desactivar"
                            : "Activar"
                        }
                        onClick={() =>
                          cambiarEstado(registro.id)
                        }
                      >
                        <Power size={17} />
                      </button>

                    </div>
                  </td>

                </tr>

              ))}

              {inventarioFiltrado.length === 0 && (

                <tr>
                  <td colSpan="7">

                    <div className="empty-table">
                      <Boxes size={38} />

                      <strong>
                        No hay asociaciones registradas
                      </strong>

                      <span>
                        Registra el primer material y asígnale una
                        ubicación física.
                      </span>
                    </div>

                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================================
          MODAL DE REGISTRO
      ====================================== */}

      {modalAbierto && (

        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >

          <div className="modal-card inventory-modal">

            {/* CABECERA */}

            <div className="modal-header">

              <div>
                <span className="page-eyebrow">
                  {registroEditando
                    ? "EDITAR ASOCIACIÓN"
                    : "NUEVA ASOCIACIÓN"}
                </span>

                <h2>
                  {registroEditando
                    ? "Editar material en inventario"
                    : "Asignar ubicación al material"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={guardarRegistro}>

              {/* BUSCADOR DEL CATÁLOGO */}

              {!registroEditando && (

                <div className="form-group form-full material-search-container">

                  <label htmlFor="materialSearch">
                    Material del Catálogo Maestro *
                  </label>

                  <div className="material-search-input">

                    <Search size={18} />

                    <input
                      id="materialSearch"
                      type="text"
                      value={busquedaMaterial}
                      placeholder="Buscar material por nombre..."
                      autoComplete="off"
                      onFocus={() =>
                        setMostrarResultados(true)
                      }
                      onChange={cambiarBusquedaMaterial}
                    />

                  </div>

                  {mostrarResultados &&
                    busquedaMaterial.trim().length >= 1 && (

                      <div className="material-search-results">

                        {materialesFiltrados.length > 0 ? (

                          materialesFiltrados.map((material) => (

                            <button
                              key={material.id}
                              type="button"
                              className="material-search-option"
                              onClick={() =>
                                seleccionarMaterial(material)
                              }
                            >

                              <div>
                                <strong>
                                  {material.descripcion}
                                </strong>

                                <span>{material.sku}</span>
                              </div>

                            </button>

                          ))

                        ) : (

                          <div className="material-search-empty">
                            No se encontraron materiales.
                          </div>

                        )}

                      </div>

                    )}

                </div>

              )}

              {/* MATERIAL SELECCIONADO */}

              {formulario.sku && (

                <div className="selected-material">

                  <span>Material asociado</span>

                  <div>
                    <strong>{formulario.sku}</strong>
                    <p>{formulario.descripcion}</p>
                  </div>

                </div>

              )}

              <div className="inventory-form-grid">

                {/* PREGUNTA SOBRE EL CÓDIGO */}

                <div className="form-group form-full code-question">

                  <label>
                    ¿El repuesto tiene código?
                  </label>

                  <div
                    className="code-radio-group"
                    role="radiogroup"
                    aria-label="¿El repuesto tiene código?"
                  >

                    <label
                      className={`code-radio-option ${
                        formulario.tieneCodigo === true
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="tieneCodigo"
                        value="si"
                        checked={formulario.tieneCodigo === true}
                        onChange={() =>
                          cambiarTieneCodigo(true)
                        }
                      />

                      <Check size={19} />

                      <span>Sí, tiene código</span>

                    </label>

                    <label
                      className={`code-radio-option ${
                        formulario.tieneCodigo === false
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="radio"
                        name="tieneCodigo"
                        value="no"
                        checked={formulario.tieneCodigo === false}
                        onChange={() =>
                          cambiarTieneCodigo(false)
                        }
                      />

                      <X size={19} />

                      <span>No tiene código</span>

                    </label>

                  </div>

                </div>

                {/* CÓDIGOS CONDICIONALES */}

                {formulario.tieneCodigo && (

                  <>

                    <div className="form-group">

                      <label htmlFor="codigo">
                        <Barcode size={15} />
                        Código del repuesto *
                      </label>

                      <input
                        id="codigo"
                        name="codigo"
                        type="text"
                        value={formulario.codigo}
                        onChange={actualizarCampo}
                        placeholder="Ej. 45872"
                        required
                      />

                      <small>
                        Ingresa el código utilizado por el almacén.
                      </small>

                    </div>

                    <div className="form-group">

                      <label htmlFor="codigoReemplazo">
                        Código de reemplazo
                      </label>

                      <input
                        id="codigoReemplazo"
                        name="codigoReemplazo"
                        type="text"
                        value={formulario.codigoReemplazo}
                        onChange={actualizarCampo}
                        placeholder="Opcional"
                      />

                      <small>
                        Solo si existe un código alternativo.
                      </small>

                    </div>

                  </>

                )}

              </div>

              {/* ==================================
                  SELECTOR PERSONALIZADO
              ================================== */}

              <div className="form-group form-full">

                <label>
                  <MapPin size={15} />
                  Ubicación física *
                </label>

                <div
                  className="custom-location-select"
                  onBlur={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget
                      )
                    ) {
                      setUbicacionMenuAbierto(false);
                    }
                  }}
                >

                  {/* BOTÓN PRINCIPAL */}

                  <button
                    type="button"
                    className={`location-select-trigger ${
                      ubicacionMenuAbierto ? "is-open" : ""
                    } ${
                      formulario.ubicacion ? "has-value" : ""
                    }`}
                    onClick={() =>
                      setUbicacionMenuAbierto((actual) => !actual)
                    }
                    aria-expanded={ubicacionMenuAbierto}
                    aria-haspopup="listbox"
                  >

                    <div className="location-trigger-content">

                      <div className="location-trigger-icon">
                        <Boxes size={20} />
                      </div>

                      <div className="location-trigger-text">

                        <strong>
                          {formulario.ubicacion ||
                            "Seleccionar ubicación"}
                        </strong>

                        <span>
                          {ubicacionFormulario
                            ? ubicacionFormulario.tieneSubdivisiones
                              ? "Jaba con subdivisiones internas"
                              : "Jaba estándar"
                            : "Selecciona el espacio físico del material"}
                        </span>

                      </div>

                    </div>

                    <ChevronDown
                      size={19}
                      className="location-chevron"
                    />

                  </button>

                  {/* PANEL DESPLEGABLE */}

                  {ubicacionMenuAbierto && (

                    <div
                      className="location-options-panel"
                      role="listbox"
                    >

                      <div className="location-options-heading">

                        <div>
                          <strong>
                            Ubicaciones disponibles
                          </strong>

                          <span>
                            Selecciona una jaba del almacén
                          </span>
                        </div>

                        <span className="location-options-count">
                          {ubicacionesAlmacen.length} espacios
                        </span>

                      </div>

                      {/* OPCIONES */}

                      <div className="location-options-list">

                        {ubicacionesAlmacen.map((ubicacion) => {

                          const tieneDivisiones =
                            ubicacion.tieneSubdivisiones;

                          const seleccionada =
                            formulario.ubicacion ===
                            ubicacion.nombre;

                          return (

                            <button
                              key={ubicacion.id}
                              type="button"
                              role="option"
                              aria-selected={seleccionada}
                              className={`location-option ${
                                seleccionada ? "selected" : ""
                              } ${
                                tieneDivisiones
                                  ? "option-divided"
                                  : "option-standard"
                              }`}
                              onClick={() =>
                                seleccionarUbicacion(ubicacion)
                              }
                            >

                              <div className="location-option-icon">

                                {tieneDivisiones ? (
                                  <Boxes size={19} />
                                ) : (
                                  <Check size={19} />
                                )}

                              </div>

                              <div className="location-option-info">

                                <strong>
                                  {ubicacion.nombre}
                                </strong>

                                <span>
                                  Estante {ubicacion.estante}
                                  {" · "}
                                  Piso {ubicacion.piso}
                                  {" · "}
                                  Columna {ubicacion.columna}
                                </span>

                              </div>

                              <span
                                className={`location-type-badge ${
                                  tieneDivisiones
                                    ? "badge-divided"
                                    : "badge-standard"
                                }`}
                              >
                                {tieneDivisiones
                                  ? "3 × 2"
                                  : "Estándar"}
                              </span>

                              {seleccionada && (
                                <Check
                                  size={18}
                                  className="location-selected-check"
                                />
                              )}

                            </button>

                          );

                        })}

                      </div>

                      {/* LEYENDA */}

                      <div className="location-options-footer">

                        <span className="location-legend divided">
                          <i />
                          Con subdivisiones
                        </span>

                        <span className="location-legend standard">
                          <i />
                          Sin subdivisiones
                        </span>

                      </div>

                    </div>

                  )}

                </div>

                {/* INFORMACIÓN DE LA UBICACIÓN */}

                {ubicacionFormulario && (

                  <div
                    className={`location-selected-info ${
                      ubicacionFormulario.tieneSubdivisiones
                        ? "selected-divided"
                        : "selected-standard"
                    }`}
                  >

                    <div className="location-selected-icon">
                      <Boxes size={21} />
                    </div>

                    <div className="location-selected-description">

                      <strong>
                        Estante {ubicacionFormulario.estante}
                        {" · "}
                        {ubicacionFormulario.nombre}
                      </strong>

                      <span>
                        Piso {ubicacionFormulario.piso}
                        {" · "}
                        Columna {ubicacionFormulario.columna}
                      </span>

                      <p>
                        {ubicacionFormulario.tieneSubdivisiones
                          ? "Esta jaba dispone de 6 divisiones internas. Selecciona la división donde guardarás el material."
                          : "Espacio estándar sin subdivisiones internas. El material se asignará directamente a esta ubicación."}
                      </p>

                    </div>

                    <span className="location-selected-badge">
                      {ubicacionFormulario.tieneSubdivisiones
                        ? "3 × 2"
                        : "Estándar"}
                    </span>

                  </div>

                )}

              </div>

              {/* SELECTOR DE SUBDIVISIONES */}

              {ubicacionFormulario?.tieneSubdivisiones && (

                <div className="form-group form-full subdivision-selector">

                  <label htmlFor="subdivision">
                    División interna *
                  </label>

                  <select
                    id="subdivision"
                    name="subdivision"
                    value={formulario.subdivision}
                    onChange={actualizarCampo}
                    required
                  >

                    <option value="">
                      Seleccionar división
                    </option>

                    {ubicacionFormulario.subdivisiones.map(
                      (division) => (

                        <option
                          key={division.id}
                          value={division.id}
                        >
                          {division.id} - {division.nombre}
                        </option>

                      )
                    )}

                  </select>

                  <small>
                    Distribución interna de 3 columnas × 2 filas.
                  </small>

                </div>

              )}

              {/* OBSERVACIONES */}

              <div className="form-group form-full">

                <label htmlFor="observacion">
                  Observación
                </label>

                <textarea
                  id="observacion"
                  name="observacion"
                  rows="3"
                  value={formulario.observacion}
                  onChange={actualizarCampo}
                  placeholder="Información adicional del material..."
                />

              </div>

              {/* MENSAJE DE ERROR */}

              {error && (

                <div className="form-error">
                  {error}
                </div>

              )}

              {/* BOTONES */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                >
                  {registroEditando
                    ? "Guardar cambios"
                    : "Guardar ubicación"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </section>
  );
}

export default InventarioPage;

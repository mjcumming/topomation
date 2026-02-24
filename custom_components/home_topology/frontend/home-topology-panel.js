/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const nt = globalThis, Vt = nt.ShadowRoot && (nt.ShadyCSS === void 0 || nt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Xt = Symbol(), ii = /* @__PURE__ */ new WeakMap();
let Li = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Xt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Vt && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ii.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ii.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const no = (n) => new Li(typeof n == "string" ? n : n + "", void 0, Xt), ke = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, o, a) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + n[a + 1], n[0]);
  return new Li(t, n, Xt);
}, ao = (n, e) => {
  if (Vt) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), o = nt.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = t.cssText, n.appendChild(i);
  }
}, oi = Vt ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return no(t);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ro, defineProperty: so, getOwnPropertyDescriptor: lo, getOwnPropertyNames: co, getOwnPropertySymbols: uo, getPrototypeOf: ho } = Object, re = globalThis, ni = re.trustedTypes, po = ni ? ni.emptyScript : "", St = re.reactiveElementPolyfillSupport, Be = (n, e) => n, Rt = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? po : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, Ii = (n, e) => !ro(n, e), ai = { attribute: !0, type: String, converter: Rt, reflect: !1, useDefault: !1, hasChanged: Ii };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), re.litPropertyMetadata ?? (re.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let xe = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ai) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(e, i, t);
      o !== void 0 && so(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: o, set: a } = lo(this.prototype, e) ?? { get() {
      return this[t];
    }, set(r) {
      this[t] = r;
    } };
    return { get: o, set(r) {
      const l = o == null ? void 0 : o.call(this);
      a == null || a.call(this, r), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ai;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Be("elementProperties"))) return;
    const e = ho(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Be("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Be("properties"))) {
      const t = this.properties, i = [...co(t), ...uo(t)];
      for (const o of i) this.createProperty(o, t[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, o] of t) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const o = this._$Eu(t, i);
      o !== void 0 && this._$Eh.set(o, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const o of i) t.unshift(oi(o));
    } else e !== void 0 && t.push(oi(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ao(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var a;
    const i = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, i);
    if (o !== void 0 && i.reflect === !0) {
      const r = (((a = i.converter) == null ? void 0 : a.toAttribute) !== void 0 ? i.converter : Rt).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var a, r;
    const i = this.constructor, o = i._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const l = i.getPropertyOptions(o), s = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((a = l.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? l.converter : Rt;
      this._$Em = o;
      const c = s.fromAttribute(t, l.type);
      this[o] = c ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    var o;
    if (e !== void 0) {
      const a = this.constructor, r = this[e];
      if (i ?? (i = a.getPropertyOptions(e)), !((i.hasChanged ?? Ii)(r, t) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: o, wrapped: a }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, r ?? t ?? this[e]), a !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), o === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, r] of this._$Ep) this[a] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [a, r] of o) {
        const { wrapped: l } = r, s = this[a];
        l !== !0 || this._$AL.has(a) || s === void 0 || this.C(a, void 0, r, s);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((o) => {
        var a;
        return (a = o.hostUpdate) == null ? void 0 : a.call(o);
      }), this.update(t)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
xe.elementStyles = [], xe.shadowRootOptions = { mode: "open" }, xe[Be("elementProperties")] = /* @__PURE__ */ new Map(), xe[Be("finalized")] = /* @__PURE__ */ new Map(), St == null || St({ ReactiveElement: xe }), (re.reactiveElementVersions ?? (re.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const He = globalThis, ut = He.trustedTypes, ri = ut ? ut.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Mi = "$lit$", ie = `lit$${Math.random().toFixed(9).slice(2)}$`, Pi = "?" + ie, fo = `<${Pi}>`, _e = document, Ve = () => _e.createComment(""), Xe = (n) => n === null || typeof n != "object" && typeof n != "function", Yt = Array.isArray, go = (n) => Yt(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", $t = `[ 	
\f\r]`, Pe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, si = /-->/g, li = />/g, de = RegExp(`>|${$t}(?:([^\\s"'>=/]+)(${$t}*=${$t}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ci = /'/g, di = /"/g, Ni = /^(?:script|style|textarea|title)$/i, mo = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), _ = mo(1), ve = Symbol.for("lit-noChange"), O = Symbol.for("lit-nothing"), ui = /* @__PURE__ */ new WeakMap(), ge = _e.createTreeWalker(_e, 129);
function Ri(n, e) {
  if (!Yt(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ri !== void 0 ? ri.createHTML(e) : e;
}
const _o = (n, e) => {
  const t = n.length - 1, i = [];
  let o, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = Pe;
  for (let l = 0; l < t; l++) {
    const s = n[l];
    let c, u, d = -1, p = 0;
    for (; p < s.length && (r.lastIndex = p, u = r.exec(s), u !== null); ) p = r.lastIndex, r === Pe ? u[1] === "!--" ? r = si : u[1] !== void 0 ? r = li : u[2] !== void 0 ? (Ni.test(u[2]) && (o = RegExp("</" + u[2], "g")), r = de) : u[3] !== void 0 && (r = de) : r === de ? u[0] === ">" ? (r = o ?? Pe, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, c = u[1], r = u[3] === void 0 ? de : u[3] === '"' ? di : ci) : r === di || r === ci ? r = de : r === si || r === li ? r = Pe : (r = de, o = void 0);
    const g = r === de && n[l + 1].startsWith("/>") ? " " : "";
    a += r === Pe ? s + fo : d >= 0 ? (i.push(c), s.slice(0, d) + Mi + s.slice(d) + ie + g) : s + ie + (d === -2 ? l : g);
  }
  return [Ri(n, a + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Ye {
  constructor({ strings: e, _$litType$: t }, i) {
    let o;
    this.parts = [];
    let a = 0, r = 0;
    const l = e.length - 1, s = this.parts, [c, u] = _o(e, t);
    if (this.el = Ye.createElement(c, i), ge.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = ge.nextNode()) !== null && s.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(Mi)) {
          const p = u[r++], g = o.getAttribute(d).split(ie), h = /([.?@])?(.*)/.exec(p);
          s.push({ type: 1, index: a, name: h[2], strings: g, ctor: h[1] === "." ? bo : h[1] === "?" ? yo : h[1] === "@" ? wo : wt }), o.removeAttribute(d);
        } else d.startsWith(ie) && (s.push({ type: 6, index: a }), o.removeAttribute(d));
        if (Ni.test(o.tagName)) {
          const d = o.textContent.split(ie), p = d.length - 1;
          if (p > 0) {
            o.textContent = ut ? ut.emptyScript : "";
            for (let g = 0; g < p; g++) o.append(d[g], Ve()), ge.nextNode(), s.push({ type: 2, index: ++a });
            o.append(d[p], Ve());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Pi) s.push({ type: 2, index: a });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(ie, d + 1)) !== -1; ) s.push({ type: 7, index: a }), d += ie.length - 1;
      }
      a++;
    }
  }
  static createElement(e, t) {
    const i = _e.createElement("template");
    return i.innerHTML = e, i;
  }
}
function De(n, e, t = n, i) {
  var r, l;
  if (e === ve) return e;
  let o = i !== void 0 ? (r = t._$Co) == null ? void 0 : r[i] : t._$Cl;
  const a = Xe(e) ? void 0 : e._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== a && ((l = o == null ? void 0 : o._$AO) == null || l.call(o, !1), a === void 0 ? o = void 0 : (o = new a(n), o._$AT(n, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = o : t._$Cl = o), o !== void 0 && (e = De(n, o._$AS(n, e.values), o, i)), e;
}
let vo = class {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, o = ((e == null ? void 0 : e.creationScope) ?? _e).importNode(t, !0);
    ge.currentNode = o;
    let a = ge.nextNode(), r = 0, l = 0, s = i[0];
    for (; s !== void 0; ) {
      if (r === s.index) {
        let c;
        s.type === 2 ? c = new Te(a, a.nextSibling, this, e) : s.type === 1 ? c = new s.ctor(a, s.name, s.strings, this, e) : s.type === 6 && (c = new xo(a, this, e)), this._$AV.push(c), s = i[++l];
      }
      r !== (s == null ? void 0 : s.index) && (a = ge.nextNode(), r++);
    }
    return ge.currentNode = _e, o;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
};
class Te {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, o) {
    this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = De(this, e, t), Xe(e) ? e === O || e == null || e === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : e !== this._$AH && e !== ve && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : go(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== O && Xe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(_e.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var a;
    const { values: t, _$litType$: i } = e, o = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Ye.createElement(Ri(i.h, i.h[0]), this.options)), i);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === o) this._$AH.p(t);
    else {
      const r = new vo(o, this), l = r.u(this.options);
      r.p(t), this.T(l), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = ui.get(e.strings);
    return t === void 0 && ui.set(e.strings, t = new Ye(e)), t;
  }
  k(e) {
    Yt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, o = 0;
    for (const a of e) o === t.length ? t.push(i = new Te(this.O(Ve()), this.O(Ve()), this, this.options)) : i = t[o], i._$AI(a), o++;
    o < t.length && (this._$AR(i && i._$AB.nextSibling, o), t.length = o);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const o = e.nextSibling;
      e.remove(), e = o;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class wt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, o, a) {
    this.type = 1, this._$AH = O, this._$AN = void 0, this.element = e, this.name = t, this._$AM = o, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = O;
  }
  _$AI(e, t = this, i, o) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) e = De(this, e, t, 0), r = !Xe(e) || e !== this._$AH && e !== ve, r && (this._$AH = e);
    else {
      const l = e;
      let s, c;
      for (e = a[0], s = 0; s < a.length - 1; s++) c = De(this, l[i + s], t, s), c === ve && (c = this._$AH[s]), r || (r = !Xe(c) || c !== this._$AH[s]), c === O ? e = O : e !== O && (e += (c ?? "") + a[s + 1]), this._$AH[s] = c;
    }
    r && !o && this.j(e);
  }
  j(e) {
    e === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class bo extends wt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === O ? void 0 : e;
  }
}
class yo extends wt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== O);
  }
}
class wo extends wt {
  constructor(e, t, i, o, a) {
    super(e, t, i, o, a), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = De(this, e, t, 0) ?? O) === ve) return;
    const i = this._$AH, o = e === O && i !== O || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, a = e !== O && (i === O || o);
    o && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class xo {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    De(this, e);
  }
}
const So = { I: Te }, Et = He.litHtmlPolyfillSupport;
Et == null || Et(Ye, Te), (He.litHtmlVersions ?? (He.litHtmlVersions = [])).push("3.3.1");
const $o = (n, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let o = i._$litPart$;
  if (o === void 0) {
    const a = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = o = new Te(e.insertBefore(Ve(), a), a, void 0, t ?? {});
  }
  return o._$AI(n), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const me = globalThis;
let Y = class extends xe {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = $o(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return ve;
  }
};
var Ei;
Y._$litElement$ = !0, Y.finalized = !0, (Ei = me.litElementHydrateSupport) == null || Ei.call(me, { LitElement: Y });
const Dt = me.litElementPolyfillSupport;
Dt == null || Dt({ LitElement: Y });
(me.litElementVersions ?? (me.litElementVersions = [])).push("4.2.1");
const Ge = ke`
  :host {
    /* HA theme variables with fallbacks */
    --primary-color: var(--primary-color, #03a9f4);
    --primary-text-color: var(--primary-text-color, #212121);
    --secondary-text-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --secondary-background-color: var(--secondary-background-color, #f5f5f5);
    --disabled-text-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

    /* Aliases for compatibility */
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --disabled-color: var(--disabled-text-color, #9e9e9e);

    /* RGB variants for rgba() usage */
    --rgb-primary-color: 3, 169, 244;
    --rgb-error-color: 244, 67, 54;
    --rgb-warning-color: 255, 152, 0;
    --rgb-success-color: 76, 175, 80;

    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 4px;
    --transition-speed: 0.2s;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: var(--card-background-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
  }

  .section-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    letter-spacing: 0.5px;
  }

  .divider {
    height: 1px;
    background: var(--divider-color);
    margin: var(--spacing-md) 0;
  }

  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
  }

  .button-primary {
    background: var(--primary-color, #03a9f4);
    color: white !important;
    border: none;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4) !important;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] .button-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-button {
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary-color);
    border-radius: var(--border-radius);
    transition: all var(--transition-speed);
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color);
  }

  .text-muted {
    color: var(--text-secondary-color);
    font-size: 12px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 12px;
    margin-top: var(--spacing-xs);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }
`;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Eo = { CHILD: 2 }, Do = (n) => (...e) => ({ _$litDirective$: n, values: e });
class Ao {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, i) {
    this._$Ct = e, this._$AM = t, this._$Ci = i;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: ko } = So, hi = () => document.createComment(""), Ne = (n, e, t) => {
  var a;
  const i = n._$AA.parentNode, o = e === void 0 ? n._$AB : e._$AA;
  if (t === void 0) {
    const r = i.insertBefore(hi(), o), l = i.insertBefore(hi(), o);
    t = new ko(r, l, n, n.options);
  } else {
    const r = t._$AB.nextSibling, l = t._$AM, s = l !== n;
    if (s) {
      let c;
      (a = t._$AQ) == null || a.call(t, n), t._$AM = n, t._$AP !== void 0 && (c = n._$AU) !== l._$AU && t._$AP(c);
    }
    if (r !== o || s) {
      let c = t._$AA;
      for (; c !== r; ) {
        const u = c.nextSibling;
        i.insertBefore(c, o), c = u;
      }
    }
  }
  return t;
}, ue = (n, e, t = n) => (n._$AI(e, t), n), To = {}, Co = (n, e = To) => n._$AH = e, Oo = (n) => n._$AH, At = (n) => {
  n._$AR(), n._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const pi = (n, e, t) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = e; o <= t; o++) i.set(n[o], o);
  return i;
}, Lo = Do(class extends Ao {
  constructor(n) {
    if (super(n), n.type !== Eo.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(n, e, t) {
    let i;
    t === void 0 ? t = e : e !== void 0 && (i = e);
    const o = [], a = [];
    let r = 0;
    for (const l of n) o[r] = i ? i(l, r) : r, a[r] = t(l, r), r++;
    return { values: a, keys: o };
  }
  render(n, e, t) {
    return this.dt(n, e, t).values;
  }
  update(n, [e, t, i]) {
    const o = Oo(n), { values: a, keys: r } = this.dt(e, t, i);
    if (!Array.isArray(o)) return this.ut = r, a;
    const l = this.ut ?? (this.ut = []), s = [];
    let c, u, d = 0, p = o.length - 1, g = 0, h = a.length - 1;
    for (; d <= p && g <= h; ) if (o[d] === null) d++;
    else if (o[p] === null) p--;
    else if (l[d] === r[g]) s[g] = ue(o[d], a[g]), d++, g++;
    else if (l[p] === r[h]) s[h] = ue(o[p], a[h]), p--, h--;
    else if (l[d] === r[h]) s[h] = ue(o[d], a[h]), Ne(n, s[h + 1], o[d]), d++, h--;
    else if (l[p] === r[g]) s[g] = ue(o[p], a[g]), Ne(n, o[d], o[p]), p--, g++;
    else if (c === void 0 && (c = pi(r, g, h), u = pi(l, d, p)), c.has(l[d])) if (c.has(l[p])) {
      const m = u.get(r[g]), S = m !== void 0 ? o[m] : null;
      if (S === null) {
        const A = Ne(n, o[d]);
        ue(A, a[g]), s[g] = A;
      } else s[g] = ue(S, a[g]), Ne(n, o[d], S), o[m] = null;
      g++;
    } else At(o[p]), p--;
    else At(o[d]), d++;
    for (; g <= h; ) {
      const m = Ne(n, s[h + 1]);
      ue(m, a[g]), s[g++] = m;
    }
    for (; d <= p; ) {
      const m = o[d++];
      m !== null && At(m);
    }
    return this.ut = r, Co(n, s), ve;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function fi(n, e) {
  var t = Object.keys(n);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(n);
    e && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(n, o).enumerable;
    })), t.push.apply(t, i);
  }
  return t;
}
function V(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? fi(Object(t), !0).forEach(function(i) {
      Io(n, i, t[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(t)) : fi(Object(t)).forEach(function(i) {
      Object.defineProperty(n, i, Object.getOwnPropertyDescriptor(t, i));
    });
  }
  return n;
}
function at(n) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? at = function(e) {
    return typeof e;
  } : at = function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, at(n);
}
function Io(n, e, t) {
  return e in n ? Object.defineProperty(n, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : n[e] = t, n;
}
function Q() {
  return Q = Object.assign || function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var i in t)
        Object.prototype.hasOwnProperty.call(t, i) && (n[i] = t[i]);
    }
    return n;
  }, Q.apply(this, arguments);
}
function Mo(n, e) {
  if (n == null) return {};
  var t = {}, i = Object.keys(n), o, a;
  for (a = 0; a < i.length; a++)
    o = i[a], !(e.indexOf(o) >= 0) && (t[o] = n[o]);
  return t;
}
function Po(n, e) {
  if (n == null) return {};
  var t = Mo(n, e), i, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(n);
    for (o = 0; o < a.length; o++)
      i = a[o], !(e.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(n, i) && (t[i] = n[i]);
  }
  return t;
}
var No = "1.15.6";
function G(n) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(n);
}
var Z = G(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Qe = G(/Edge/i), gi = G(/firefox/i), Ue = G(/safari/i) && !G(/chrome/i) && !G(/android/i), Gt = G(/iP(ad|od|hone)/i), Fi = G(/chrome/i) && G(/android/i), zi = {
  capture: !1,
  passive: !1
};
function x(n, e, t) {
  n.addEventListener(e, t, !Z && zi);
}
function w(n, e, t) {
  n.removeEventListener(e, t, !Z && zi);
}
function ht(n, e) {
  if (e) {
    if (e[0] === ">" && (e = e.substring(1)), n)
      try {
        if (n.matches)
          return n.matches(e);
        if (n.msMatchesSelector)
          return n.msMatchesSelector(e);
        if (n.webkitMatchesSelector)
          return n.webkitMatchesSelector(e);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Bi(n) {
  return n.host && n !== document && n.host.nodeType ? n.host : n.parentNode;
}
function W(n, e, t, i) {
  if (n) {
    t = t || document;
    do {
      if (e != null && (e[0] === ">" ? n.parentNode === t && ht(n, e) : ht(n, e)) || i && n === t)
        return n;
      if (n === t) break;
    } while (n = Bi(n));
  }
  return null;
}
var mi = /\s+/g;
function B(n, e, t) {
  if (n && e)
    if (n.classList)
      n.classList[t ? "add" : "remove"](e);
    else {
      var i = (" " + n.className + " ").replace(mi, " ").replace(" " + e + " ", " ");
      n.className = (i + (t ? " " + e : "")).replace(mi, " ");
    }
}
function v(n, e, t) {
  var i = n && n.style;
  if (i) {
    if (t === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? t = document.defaultView.getComputedStyle(n, "") : n.currentStyle && (t = n.currentStyle), e === void 0 ? t : t[e];
    !(e in i) && e.indexOf("webkit") === -1 && (e = "-webkit-" + e), i[e] = t + (typeof t == "string" ? "" : "px");
  }
}
function Ee(n, e) {
  var t = "";
  if (typeof n == "string")
    t = n;
  else
    do {
      var i = v(n, "transform");
      i && i !== "none" && (t = i + " " + t);
    } while (!e && (n = n.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(t);
}
function Hi(n, e, t) {
  if (n) {
    var i = n.getElementsByTagName(e), o = 0, a = i.length;
    if (t)
      for (; o < a; o++)
        t(i[o], o);
    return i;
  }
  return [];
}
function j() {
  var n = document.scrollingElement;
  return n || document.documentElement;
}
function C(n, e, t, i, o) {
  if (!(!n.getBoundingClientRect && n !== window)) {
    var a, r, l, s, c, u, d;
    if (n !== window && n.parentNode && n !== j() ? (a = n.getBoundingClientRect(), r = a.top, l = a.left, s = a.bottom, c = a.right, u = a.height, d = a.width) : (r = 0, l = 0, s = window.innerHeight, c = window.innerWidth, u = window.innerHeight, d = window.innerWidth), (e || t) && n !== window && (o = o || n.parentNode, !Z))
      do
        if (o && o.getBoundingClientRect && (v(o, "transform") !== "none" || t && v(o, "position") !== "static")) {
          var p = o.getBoundingClientRect();
          r -= p.top + parseInt(v(o, "border-top-width")), l -= p.left + parseInt(v(o, "border-left-width")), s = r + a.height, c = l + a.width;
          break;
        }
      while (o = o.parentNode);
    if (i && n !== window) {
      var g = Ee(o || n), h = g && g.a, m = g && g.d;
      g && (r /= m, l /= h, d /= h, u /= m, s = r + u, c = l + d);
    }
    return {
      top: r,
      left: l,
      bottom: s,
      right: c,
      width: d,
      height: u
    };
  }
}
function _i(n, e, t) {
  for (var i = ae(n, !0), o = C(n)[e]; i; ) {
    var a = C(i)[t], r = void 0;
    if (r = o >= a, !r) return i;
    if (i === j()) break;
    i = ae(i, !1);
  }
  return !1;
}
function Ae(n, e, t, i) {
  for (var o = 0, a = 0, r = n.children; a < r.length; ) {
    if (r[a].style.display !== "none" && r[a] !== b.ghost && (i || r[a] !== b.dragged) && W(r[a], t.draggable, n, !1)) {
      if (o === e)
        return r[a];
      o++;
    }
    a++;
  }
  return null;
}
function Qt(n, e) {
  for (var t = n.lastElementChild; t && (t === b.ghost || v(t, "display") === "none" || e && !ht(t, e)); )
    t = t.previousElementSibling;
  return t || null;
}
function U(n, e) {
  var t = 0;
  if (!n || !n.parentNode)
    return -1;
  for (; n = n.previousElementSibling; )
    n.nodeName.toUpperCase() !== "TEMPLATE" && n !== b.clone && (!e || ht(n, e)) && t++;
  return t;
}
function vi(n) {
  var e = 0, t = 0, i = j();
  if (n)
    do {
      var o = Ee(n), a = o.a, r = o.d;
      e += n.scrollLeft * a, t += n.scrollTop * r;
    } while (n !== i && (n = n.parentNode));
  return [e, t];
}
function Ro(n, e) {
  for (var t in n)
    if (n.hasOwnProperty(t)) {
      for (var i in e)
        if (e.hasOwnProperty(i) && e[i] === n[t][i]) return Number(t);
    }
  return -1;
}
function ae(n, e) {
  if (!n || !n.getBoundingClientRect) return j();
  var t = n, i = !1;
  do
    if (t.clientWidth < t.scrollWidth || t.clientHeight < t.scrollHeight) {
      var o = v(t);
      if (t.clientWidth < t.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || t.clientHeight < t.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!t.getBoundingClientRect || t === document.body) return j();
        if (i || e) return t;
        i = !0;
      }
    }
  while (t = t.parentNode);
  return j();
}
function Fo(n, e) {
  if (n && e)
    for (var t in e)
      e.hasOwnProperty(t) && (n[t] = e[t]);
  return n;
}
function kt(n, e) {
  return Math.round(n.top) === Math.round(e.top) && Math.round(n.left) === Math.round(e.left) && Math.round(n.height) === Math.round(e.height) && Math.round(n.width) === Math.round(e.width);
}
var Ke;
function Ui(n, e) {
  return function() {
    if (!Ke) {
      var t = arguments, i = this;
      t.length === 1 ? n.call(i, t[0]) : n.apply(i, t), Ke = setTimeout(function() {
        Ke = void 0;
      }, e);
    }
  };
}
function zo() {
  clearTimeout(Ke), Ke = void 0;
}
function Ki(n, e, t) {
  n.scrollLeft += e, n.scrollTop += t;
}
function Wi(n) {
  var e = window.Polymer, t = window.jQuery || window.Zepto;
  return e && e.dom ? e.dom(n).cloneNode(!0) : t ? t(n).clone(!0)[0] : n.cloneNode(!0);
}
function qi(n, e, t) {
  var i = {};
  return Array.from(n.children).forEach(function(o) {
    var a, r, l, s;
    if (!(!W(o, e.draggable, n, !1) || o.animated || o === t)) {
      var c = C(o);
      i.left = Math.min((a = i.left) !== null && a !== void 0 ? a : 1 / 0, c.left), i.top = Math.min((r = i.top) !== null && r !== void 0 ? r : 1 / 0, c.top), i.right = Math.max((l = i.right) !== null && l !== void 0 ? l : -1 / 0, c.right), i.bottom = Math.max((s = i.bottom) !== null && s !== void 0 ? s : -1 / 0, c.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var N = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function Bo() {
  var n = [], e;
  return {
    captureAnimationState: function() {
      if (n = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(v(o, "display") === "none" || o === b.ghost)) {
            n.push({
              target: o,
              rect: C(o)
            });
            var a = V({}, n[n.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = Ee(o, !0);
              r && (a.top -= r.f, a.left -= r.e);
            }
            o.fromRect = a;
          }
        });
      }
    },
    addAnimationState: function(i) {
      n.push(i);
    },
    removeAnimationState: function(i) {
      n.splice(Ro(n, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(e), typeof i == "function" && i();
        return;
      }
      var a = !1, r = 0;
      n.forEach(function(l) {
        var s = 0, c = l.target, u = c.fromRect, d = C(c), p = c.prevFromRect, g = c.prevToRect, h = l.rect, m = Ee(c, !0);
        m && (d.top -= m.f, d.left -= m.e), c.toRect = d, c.thisAnimationDuration && kt(p, d) && !kt(u, d) && // Make sure animatingRect is on line between toRect & fromRect
        (h.top - d.top) / (h.left - d.left) === (u.top - d.top) / (u.left - d.left) && (s = Uo(h, p, g, o.options)), kt(d, u) || (c.prevFromRect = u, c.prevToRect = d, s || (s = o.options.animation), o.animate(c, h, d, s)), s && (a = !0, r = Math.max(r, s), clearTimeout(c.animationResetTimer), c.animationResetTimer = setTimeout(function() {
          c.animationTime = 0, c.prevFromRect = null, c.fromRect = null, c.prevToRect = null, c.thisAnimationDuration = null;
        }, s), c.thisAnimationDuration = s);
      }), clearTimeout(e), a ? e = setTimeout(function() {
        typeof i == "function" && i();
      }, r) : typeof i == "function" && i(), n = [];
    },
    animate: function(i, o, a, r) {
      if (r) {
        v(i, "transition", ""), v(i, "transform", "");
        var l = Ee(this.el), s = l && l.a, c = l && l.d, u = (o.left - a.left) / (s || 1), d = (o.top - a.top) / (c || 1);
        i.animatingX = !!u, i.animatingY = !!d, v(i, "transform", "translate3d(" + u + "px," + d + "px,0)"), this.forRepaintDummy = Ho(i), v(i, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")), v(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          v(i, "transition", ""), v(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, r);
      }
    }
  };
}
function Ho(n) {
  return n.offsetWidth;
}
function Uo(n, e, t, i) {
  return Math.sqrt(Math.pow(e.top - n.top, 2) + Math.pow(e.left - n.left, 2)) / Math.sqrt(Math.pow(e.top - t.top, 2) + Math.pow(e.left - t.left, 2)) * i.animation;
}
var ye = [], Tt = {
  initializeByDefault: !0
}, Ze = {
  mount: function(e) {
    for (var t in Tt)
      Tt.hasOwnProperty(t) && !(t in e) && (e[t] = Tt[t]);
    ye.forEach(function(i) {
      if (i.pluginName === e.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(e.pluginName, " more than once");
    }), ye.push(e);
  },
  pluginEvent: function(e, t, i) {
    var o = this;
    this.eventCanceled = !1, i.cancel = function() {
      o.eventCanceled = !0;
    };
    var a = e + "Global";
    ye.forEach(function(r) {
      t[r.pluginName] && (t[r.pluginName][a] && t[r.pluginName][a](V({
        sortable: t
      }, i)), t.options[r.pluginName] && t[r.pluginName][e] && t[r.pluginName][e](V({
        sortable: t
      }, i)));
    });
  },
  initializePlugins: function(e, t, i, o) {
    ye.forEach(function(l) {
      var s = l.pluginName;
      if (!(!e.options[s] && !l.initializeByDefault)) {
        var c = new l(e, t, e.options);
        c.sortable = e, c.options = e.options, e[s] = c, Q(i, c.defaults);
      }
    });
    for (var a in e.options)
      if (e.options.hasOwnProperty(a)) {
        var r = this.modifyOption(e, a, e.options[a]);
        typeof r < "u" && (e.options[a] = r);
      }
  },
  getEventProperties: function(e, t) {
    var i = {};
    return ye.forEach(function(o) {
      typeof o.eventProperties == "function" && Q(i, o.eventProperties.call(t[o.pluginName], e));
    }), i;
  },
  modifyOption: function(e, t, i) {
    var o;
    return ye.forEach(function(a) {
      e[a.pluginName] && a.optionListeners && typeof a.optionListeners[t] == "function" && (o = a.optionListeners[t].call(e[a.pluginName], i));
    }), o;
  }
};
function Ko(n) {
  var e = n.sortable, t = n.rootEl, i = n.name, o = n.targetEl, a = n.cloneEl, r = n.toEl, l = n.fromEl, s = n.oldIndex, c = n.newIndex, u = n.oldDraggableIndex, d = n.newDraggableIndex, p = n.originalEvent, g = n.putSortable, h = n.extraEventProperties;
  if (e = e || t && t[N], !!e) {
    var m, S = e.options, A = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !Z && !Qe ? m = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (m = document.createEvent("Event"), m.initEvent(i, !0, !0)), m.to = r || t, m.from = l || t, m.item = o || t, m.clone = a, m.oldIndex = s, m.newIndex = c, m.oldDraggableIndex = u, m.newDraggableIndex = d, m.originalEvent = p, m.pullMode = g ? g.lastPutMode : void 0;
    var $ = V(V({}, h), Ze.getEventProperties(i, e));
    for (var R in $)
      m[R] = $[R];
    t && t.dispatchEvent(m), S[A] && S[A].call(e, m);
  }
}
var Wo = ["evt"], P = function(e, t) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, a = Po(i, Wo);
  Ze.pluginEvent.bind(b)(e, t, V({
    dragEl: f,
    parentEl: k,
    ghostEl: y,
    rootEl: E,
    nextEl: fe,
    lastDownEl: rt,
    cloneEl: D,
    cloneHidden: oe,
    dragStarted: Re,
    putSortable: L,
    activeSortable: b.active,
    originalEvent: o,
    oldIndex: $e,
    oldDraggableIndex: We,
    newIndex: H,
    newDraggableIndex: te,
    hideGhostForTarget: Yi,
    unhideGhostForTarget: Gi,
    cloneNowHidden: function() {
      oe = !0;
    },
    cloneNowShown: function() {
      oe = !1;
    },
    dispatchSortableEvent: function(l) {
      M({
        sortable: t,
        name: l,
        originalEvent: o
      });
    }
  }, a));
};
function M(n) {
  Ko(V({
    putSortable: L,
    cloneEl: D,
    targetEl: f,
    rootEl: E,
    oldIndex: $e,
    oldDraggableIndex: We,
    newIndex: H,
    newDraggableIndex: te
  }, n));
}
var f, k, y, E, fe, rt, D, oe, $e, H, We, te, et, L, Se = !1, pt = !1, ft = [], he, K, Ct, Ot, bi, yi, Re, we, qe, je = !1, tt = !1, st, I, Lt = [], Ft = !1, gt = [], xt = typeof document < "u", it = Gt, wi = Qe || Z ? "cssFloat" : "float", qo = xt && !Fi && !Gt && "draggable" in document.createElement("div"), ji = function() {
  if (xt) {
    if (Z)
      return !1;
    var n = document.createElement("x");
    return n.style.cssText = "pointer-events:auto", n.style.pointerEvents === "auto";
  }
}(), Vi = function(e, t) {
  var i = v(e), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), a = Ae(e, 0, t), r = Ae(e, 1, t), l = a && v(a), s = r && v(r), c = l && parseInt(l.marginLeft) + parseInt(l.marginRight) + C(a).width, u = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + C(r).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (a && l.float && l.float !== "none") {
    var d = l.float === "left" ? "left" : "right";
    return r && (s.clear === "both" || s.clear === d) ? "vertical" : "horizontal";
  }
  return a && (l.display === "block" || l.display === "flex" || l.display === "table" || l.display === "grid" || c >= o && i[wi] === "none" || r && i[wi] === "none" && c + u > o) ? "vertical" : "horizontal";
}, jo = function(e, t, i) {
  var o = i ? e.left : e.top, a = i ? e.right : e.bottom, r = i ? e.width : e.height, l = i ? t.left : t.top, s = i ? t.right : t.bottom, c = i ? t.width : t.height;
  return o === l || a === s || o + r / 2 === l + c / 2;
}, Vo = function(e, t) {
  var i;
  return ft.some(function(o) {
    var a = o[N].options.emptyInsertThreshold;
    if (!(!a || Qt(o))) {
      var r = C(o), l = e >= r.left - a && e <= r.right + a, s = t >= r.top - a && t <= r.bottom + a;
      if (l && s)
        return i = o;
    }
  }), i;
}, Xi = function(e) {
  function t(a, r) {
    return function(l, s, c, u) {
      var d = l.options.group.name && s.options.group.name && l.options.group.name === s.options.group.name;
      if (a == null && (r || d))
        return !0;
      if (a == null || a === !1)
        return !1;
      if (r && a === "clone")
        return a;
      if (typeof a == "function")
        return t(a(l, s, c, u), r)(l, s, c, u);
      var p = (r ? l : s).options.group.name;
      return a === !0 || typeof a == "string" && a === p || a.join && a.indexOf(p) > -1;
    };
  }
  var i = {}, o = e.group;
  (!o || at(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = t(o.pull, !0), i.checkPut = t(o.put), i.revertClone = o.revertClone, e.group = i;
}, Yi = function() {
  !ji && y && v(y, "display", "none");
}, Gi = function() {
  !ji && y && v(y, "display", "");
};
xt && !Fi && document.addEventListener("click", function(n) {
  if (pt)
    return n.preventDefault(), n.stopPropagation && n.stopPropagation(), n.stopImmediatePropagation && n.stopImmediatePropagation(), pt = !1, !1;
}, !0);
var pe = function(e) {
  if (f) {
    e = e.touches ? e.touches[0] : e;
    var t = Vo(e.clientX, e.clientY);
    if (t) {
      var i = {};
      for (var o in e)
        e.hasOwnProperty(o) && (i[o] = e[o]);
      i.target = i.rootEl = t, i.preventDefault = void 0, i.stopPropagation = void 0, t[N]._onDragOver(i);
    }
  }
}, Xo = function(e) {
  f && f.parentNode[N]._isOutsideThisEl(e.target);
};
function b(n, e) {
  if (!(n && n.nodeType && n.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(n));
  this.el = n, this.options = e = Q({}, e), n[N] = this;
  var t = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(n.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return Vi(n, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(r, l) {
      r.setData("Text", l.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: b.supportPointer !== !1 && "PointerEvent" in window && (!Ue || Gt),
    emptyInsertThreshold: 5
  };
  Ze.initializePlugins(this, n, t);
  for (var i in t)
    !(i in e) && (e[i] = t[i]);
  Xi(e);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = e.forceFallback ? !1 : qo, this.nativeDraggable && (this.options.touchStartThreshold = 1), e.supportPointer ? x(n, "pointerdown", this._onTapStart) : (x(n, "mousedown", this._onTapStart), x(n, "touchstart", this._onTapStart)), this.nativeDraggable && (x(n, "dragover", this), x(n, "dragenter", this)), ft.push(this.el), e.store && e.store.get && this.sort(e.store.get(this) || []), Q(this, Bo());
}
b.prototype = /** @lends Sortable.prototype */
{
  constructor: b,
  _isOutsideThisEl: function(e) {
    !this.el.contains(e) && e !== this.el && (we = null);
  },
  _getDirection: function(e, t) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, e, t, f) : this.options.direction;
  },
  _onTapStart: function(e) {
    if (e.cancelable) {
      var t = this, i = this.el, o = this.options, a = o.preventOnFilter, r = e.type, l = e.touches && e.touches[0] || e.pointerType && e.pointerType === "touch" && e, s = (l || e).target, c = e.target.shadowRoot && (e.path && e.path[0] || e.composedPath && e.composedPath()[0]) || s, u = o.filter;
      if (on(i), !f && !(/mousedown|pointerdown/.test(r) && e.button !== 0 || o.disabled) && !c.isContentEditable && !(!this.nativeDraggable && Ue && s && s.tagName.toUpperCase() === "SELECT") && (s = W(s, o.draggable, i, !1), !(s && s.animated) && rt !== s)) {
        if ($e = U(s), We = U(s, o.draggable), typeof u == "function") {
          if (u.call(this, e, s, this)) {
            M({
              sortable: t,
              rootEl: c,
              name: "filter",
              targetEl: s,
              toEl: i,
              fromEl: i
            }), P("filter", t, {
              evt: e
            }), a && e.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(d) {
          if (d = W(c, d.trim(), i, !1), d)
            return M({
              sortable: t,
              rootEl: d,
              name: "filter",
              targetEl: s,
              fromEl: i,
              toEl: i
            }), P("filter", t, {
              evt: e
            }), !0;
        }), u)) {
          a && e.preventDefault();
          return;
        }
        o.handle && !W(c, o.handle, i, !1) || this._prepareDragStart(e, l, s);
      }
    }
  },
  _prepareDragStart: function(e, t, i) {
    var o = this, a = o.el, r = o.options, l = a.ownerDocument, s;
    if (i && !f && i.parentNode === a) {
      var c = C(i);
      if (E = a, f = i, k = f.parentNode, fe = f.nextSibling, rt = i, et = r.group, b.dragged = f, he = {
        target: f,
        clientX: (t || e).clientX,
        clientY: (t || e).clientY
      }, bi = he.clientX - c.left, yi = he.clientY - c.top, this._lastX = (t || e).clientX, this._lastY = (t || e).clientY, f.style["will-change"] = "all", s = function() {
        if (P("delayEnded", o, {
          evt: e
        }), b.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !gi && o.nativeDraggable && (f.draggable = !0), o._triggerDragStart(e, t), M({
          sortable: o,
          name: "choose",
          originalEvent: e
        }), B(f, r.chosenClass, !0);
      }, r.ignore.split(",").forEach(function(u) {
        Hi(f, u.trim(), It);
      }), x(l, "dragover", pe), x(l, "mousemove", pe), x(l, "touchmove", pe), r.supportPointer ? (x(l, "pointerup", o._onDrop), !this.nativeDraggable && x(l, "pointercancel", o._onDrop)) : (x(l, "mouseup", o._onDrop), x(l, "touchend", o._onDrop), x(l, "touchcancel", o._onDrop)), gi && this.nativeDraggable && (this.options.touchStartThreshold = 4, f.draggable = !0), P("delayStart", this, {
        evt: e
      }), r.delay && (!r.delayOnTouchOnly || t) && (!this.nativeDraggable || !(Qe || Z))) {
        if (b.eventCanceled) {
          this._onDrop();
          return;
        }
        r.supportPointer ? (x(l, "pointerup", o._disableDelayedDrag), x(l, "pointercancel", o._disableDelayedDrag)) : (x(l, "mouseup", o._disableDelayedDrag), x(l, "touchend", o._disableDelayedDrag), x(l, "touchcancel", o._disableDelayedDrag)), x(l, "mousemove", o._delayedDragTouchMoveHandler), x(l, "touchmove", o._delayedDragTouchMoveHandler), r.supportPointer && x(l, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(s, r.delay);
      } else
        s();
    }
  },
  _delayedDragTouchMoveHandler: function(e) {
    var t = e.touches ? e.touches[0] : e;
    Math.max(Math.abs(t.clientX - this._lastX), Math.abs(t.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    f && It(f), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var e = this.el.ownerDocument;
    w(e, "mouseup", this._disableDelayedDrag), w(e, "touchend", this._disableDelayedDrag), w(e, "touchcancel", this._disableDelayedDrag), w(e, "pointerup", this._disableDelayedDrag), w(e, "pointercancel", this._disableDelayedDrag), w(e, "mousemove", this._delayedDragTouchMoveHandler), w(e, "touchmove", this._delayedDragTouchMoveHandler), w(e, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(e, t) {
    t = t || e.pointerType == "touch" && e, !this.nativeDraggable || t ? this.options.supportPointer ? x(document, "pointermove", this._onTouchMove) : t ? x(document, "touchmove", this._onTouchMove) : x(document, "mousemove", this._onTouchMove) : (x(f, "dragend", this), x(E, "dragstart", this._onDragStart));
    try {
      document.selection ? lt(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(e, t) {
    if (Se = !1, E && f) {
      P("dragStarted", this, {
        evt: t
      }), this.nativeDraggable && x(document, "dragover", Xo);
      var i = this.options;
      !e && B(f, i.dragClass, !1), B(f, i.ghostClass, !0), b.active = this, e && this._appendGhost(), M({
        sortable: this,
        name: "start",
        originalEvent: t
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (K) {
      this._lastX = K.clientX, this._lastY = K.clientY, Yi();
      for (var e = document.elementFromPoint(K.clientX, K.clientY), t = e; e && e.shadowRoot && (e = e.shadowRoot.elementFromPoint(K.clientX, K.clientY), e !== t); )
        t = e;
      if (f.parentNode[N]._isOutsideThisEl(e), t)
        do {
          if (t[N]) {
            var i = void 0;
            if (i = t[N]._onDragOver({
              clientX: K.clientX,
              clientY: K.clientY,
              target: e,
              rootEl: t
            }), i && !this.options.dragoverBubble)
              break;
          }
          e = t;
        } while (t = Bi(t));
      Gi();
    }
  },
  _onTouchMove: function(e) {
    if (he) {
      var t = this.options, i = t.fallbackTolerance, o = t.fallbackOffset, a = e.touches ? e.touches[0] : e, r = y && Ee(y, !0), l = y && r && r.a, s = y && r && r.d, c = it && I && vi(I), u = (a.clientX - he.clientX + o.x) / (l || 1) + (c ? c[0] - Lt[0] : 0) / (l || 1), d = (a.clientY - he.clientY + o.y) / (s || 1) + (c ? c[1] - Lt[1] : 0) / (s || 1);
      if (!b.active && !Se) {
        if (i && Math.max(Math.abs(a.clientX - this._lastX), Math.abs(a.clientY - this._lastY)) < i)
          return;
        this._onDragStart(e, !0);
      }
      if (y) {
        r ? (r.e += u - (Ct || 0), r.f += d - (Ot || 0)) : r = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: d
        };
        var p = "matrix(".concat(r.a, ",").concat(r.b, ",").concat(r.c, ",").concat(r.d, ",").concat(r.e, ",").concat(r.f, ")");
        v(y, "webkitTransform", p), v(y, "mozTransform", p), v(y, "msTransform", p), v(y, "transform", p), Ct = u, Ot = d, K = a;
      }
      e.cancelable && e.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!y) {
      var e = this.options.fallbackOnBody ? document.body : E, t = C(f, !0, it, !0, e), i = this.options;
      if (it) {
        for (I = e; v(I, "position") === "static" && v(I, "transform") === "none" && I !== document; )
          I = I.parentNode;
        I !== document.body && I !== document.documentElement ? (I === document && (I = j()), t.top += I.scrollTop, t.left += I.scrollLeft) : I = j(), Lt = vi(I);
      }
      y = f.cloneNode(!0), B(y, i.ghostClass, !1), B(y, i.fallbackClass, !0), B(y, i.dragClass, !0), v(y, "transition", ""), v(y, "transform", ""), v(y, "box-sizing", "border-box"), v(y, "margin", 0), v(y, "top", t.top), v(y, "left", t.left), v(y, "width", t.width), v(y, "height", t.height), v(y, "opacity", "0.8"), v(y, "position", it ? "absolute" : "fixed"), v(y, "zIndex", "100000"), v(y, "pointerEvents", "none"), b.ghost = y, e.appendChild(y), v(y, "transform-origin", bi / parseInt(y.style.width) * 100 + "% " + yi / parseInt(y.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(e, t) {
    var i = this, o = e.dataTransfer, a = i.options;
    if (P("dragStart", this, {
      evt: e
    }), b.eventCanceled) {
      this._onDrop();
      return;
    }
    P("setupClone", this), b.eventCanceled || (D = Wi(f), D.removeAttribute("id"), D.draggable = !1, D.style["will-change"] = "", this._hideClone(), B(D, this.options.chosenClass, !1), b.clone = D), i.cloneId = lt(function() {
      P("clone", i), !b.eventCanceled && (i.options.removeCloneOnHide || E.insertBefore(D, f), i._hideClone(), M({
        sortable: i,
        name: "clone"
      }));
    }), !t && B(f, a.dragClass, !0), t ? (pt = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (w(document, "mouseup", i._onDrop), w(document, "touchend", i._onDrop), w(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", a.setData && a.setData.call(i, o, f)), x(document, "drop", i), v(f, "transform", "translateZ(0)")), Se = !0, i._dragStartId = lt(i._dragStarted.bind(i, t, e)), x(document, "selectstart", i), Re = !0, window.getSelection().removeAllRanges(), Ue && v(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(e) {
    var t = this.el, i = e.target, o, a, r, l = this.options, s = l.group, c = b.active, u = et === s, d = l.sort, p = L || c, g, h = this, m = !1;
    if (Ft) return;
    function S(Me, io) {
      P(Me, h, V({
        evt: e,
        isOwner: u,
        axis: g ? "vertical" : "horizontal",
        revert: r,
        dragRect: o,
        targetRect: a,
        canSort: d,
        fromSortable: p,
        target: i,
        completed: $,
        onMove: function(ti, oo) {
          return ot(E, t, f, o, ti, C(ti), e, oo);
        },
        changed: R
      }, io));
    }
    function A() {
      S("dragOverAnimationCapture"), h.captureAnimationState(), h !== p && p.captureAnimationState();
    }
    function $(Me) {
      return S("dragOverCompleted", {
        insertion: Me
      }), Me && (u ? c._hideClone() : c._showClone(h), h !== p && (B(f, L ? L.options.ghostClass : c.options.ghostClass, !1), B(f, l.ghostClass, !0)), L !== h && h !== b.active ? L = h : h === b.active && L && (L = null), p === h && (h._ignoreWhileAnimating = i), h.animateAll(function() {
        S("dragOverAnimationComplete"), h._ignoreWhileAnimating = null;
      }), h !== p && (p.animateAll(), p._ignoreWhileAnimating = null)), (i === f && !f.animated || i === t && !i.animated) && (we = null), !l.dragoverBubble && !e.rootEl && i !== document && (f.parentNode[N]._isOutsideThisEl(e.target), !Me && pe(e)), !l.dragoverBubble && e.stopPropagation && e.stopPropagation(), m = !0;
    }
    function R() {
      H = U(f), te = U(f, l.draggable), M({
        sortable: h,
        name: "change",
        toEl: t,
        newIndex: H,
        newDraggableIndex: te,
        originalEvent: e
      });
    }
    if (e.preventDefault !== void 0 && e.cancelable && e.preventDefault(), i = W(i, l.draggable, t, !0), S("dragOver"), b.eventCanceled) return m;
    if (f.contains(e.target) || i.animated && i.animatingX && i.animatingY || h._ignoreWhileAnimating === i)
      return $(!1);
    if (pt = !1, c && !l.disabled && (u ? d || (r = k !== E) : L === this || (this.lastPutMode = et.checkPull(this, c, f, e)) && s.checkPut(this, c, f, e))) {
      if (g = this._getDirection(e, i) === "vertical", o = C(f), S("dragOverValid"), b.eventCanceled) return m;
      if (r)
        return k = E, A(), this._hideClone(), S("revert"), b.eventCanceled || (fe ? E.insertBefore(f, fe) : E.appendChild(f)), $(!0);
      var F = Qt(t, l.draggable);
      if (!F || Zo(e, g, this) && !F.animated) {
        if (F === f)
          return $(!1);
        if (F && t === e.target && (i = F), i && (a = C(i)), ot(E, t, f, o, i, a, e, !!i) !== !1)
          return A(), F && F.nextSibling ? t.insertBefore(f, F.nextSibling) : t.appendChild(f), k = t, R(), $(!0);
      } else if (F && Qo(e, g, this)) {
        var se = Ae(t, 0, l, !0);
        if (se === f)
          return $(!1);
        if (i = se, a = C(i), ot(E, t, f, o, i, a, e, !1) !== !1)
          return A(), t.insertBefore(f, se), k = t, R(), $(!0);
      } else if (i.parentNode === t) {
        a = C(i);
        var q = 0, le, Ce = f.parentNode !== t, z = !jo(f.animated && f.toRect || o, i.animated && i.toRect || a, g), Oe = g ? "top" : "left", J = _i(i, "top", "top") || _i(f, "top", "top"), Le = J ? J.scrollTop : void 0;
        we !== i && (le = a[Oe], je = !1, tt = !z && l.invertSwap || Ce), q = Jo(e, i, a, g, z ? 1 : l.swapThreshold, l.invertedSwapThreshold == null ? l.swapThreshold : l.invertedSwapThreshold, tt, we === i);
        var X;
        if (q !== 0) {
          var ce = U(f);
          do
            ce -= q, X = k.children[ce];
          while (X && (v(X, "display") === "none" || X === y));
        }
        if (q === 0 || X === i)
          return $(!1);
        we = i, qe = q;
        var Ie = i.nextElementSibling, ee = !1;
        ee = q === 1;
        var Je = ot(E, t, f, o, i, a, e, ee);
        if (Je !== !1)
          return (Je === 1 || Je === -1) && (ee = Je === 1), Ft = !0, setTimeout(Go, 30), A(), ee && !Ie ? t.appendChild(f) : i.parentNode.insertBefore(f, ee ? Ie : i), J && Ki(J, 0, Le - J.scrollTop), k = f.parentNode, le !== void 0 && !tt && (st = Math.abs(le - C(i)[Oe])), R(), $(!0);
      }
      if (t.contains(f))
        return $(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    w(document, "mousemove", this._onTouchMove), w(document, "touchmove", this._onTouchMove), w(document, "pointermove", this._onTouchMove), w(document, "dragover", pe), w(document, "mousemove", pe), w(document, "touchmove", pe);
  },
  _offUpEvents: function() {
    var e = this.el.ownerDocument;
    w(e, "mouseup", this._onDrop), w(e, "touchend", this._onDrop), w(e, "pointerup", this._onDrop), w(e, "pointercancel", this._onDrop), w(e, "touchcancel", this._onDrop), w(document, "selectstart", this);
  },
  _onDrop: function(e) {
    var t = this.el, i = this.options;
    if (H = U(f), te = U(f, i.draggable), P("drop", this, {
      evt: e
    }), k = f && f.parentNode, H = U(f), te = U(f, i.draggable), b.eventCanceled) {
      this._nulling();
      return;
    }
    Se = !1, tt = !1, je = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), zt(this.cloneId), zt(this._dragStartId), this.nativeDraggable && (w(document, "drop", this), w(t, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Ue && v(document.body, "user-select", ""), v(f, "transform", ""), e && (Re && (e.cancelable && e.preventDefault(), !i.dropBubble && e.stopPropagation()), y && y.parentNode && y.parentNode.removeChild(y), (E === k || L && L.lastPutMode !== "clone") && D && D.parentNode && D.parentNode.removeChild(D), f && (this.nativeDraggable && w(f, "dragend", this), It(f), f.style["will-change"] = "", Re && !Se && B(f, L ? L.options.ghostClass : this.options.ghostClass, !1), B(f, this.options.chosenClass, !1), M({
      sortable: this,
      name: "unchoose",
      toEl: k,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: e
    }), E !== k ? (H >= 0 && (M({
      rootEl: k,
      name: "add",
      toEl: k,
      fromEl: E,
      originalEvent: e
    }), M({
      sortable: this,
      name: "remove",
      toEl: k,
      originalEvent: e
    }), M({
      rootEl: k,
      name: "sort",
      toEl: k,
      fromEl: E,
      originalEvent: e
    }), M({
      sortable: this,
      name: "sort",
      toEl: k,
      originalEvent: e
    })), L && L.save()) : H !== $e && H >= 0 && (M({
      sortable: this,
      name: "update",
      toEl: k,
      originalEvent: e
    }), M({
      sortable: this,
      name: "sort",
      toEl: k,
      originalEvent: e
    })), b.active && ((H == null || H === -1) && (H = $e, te = We), M({
      sortable: this,
      name: "end",
      toEl: k,
      originalEvent: e
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    P("nulling", this), E = f = k = y = fe = D = rt = oe = he = K = Re = H = te = $e = We = we = qe = L = et = b.dragged = b.ghost = b.clone = b.active = null, gt.forEach(function(e) {
      e.checked = !0;
    }), gt.length = Ct = Ot = 0;
  },
  handleEvent: function(e) {
    switch (e.type) {
      case "drop":
      case "dragend":
        this._onDrop(e);
        break;
      case "dragenter":
      case "dragover":
        f && (this._onDragOver(e), Yo(e));
        break;
      case "selectstart":
        e.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var e = [], t, i = this.el.children, o = 0, a = i.length, r = this.options; o < a; o++)
      t = i[o], W(t, r.draggable, this.el, !1) && e.push(t.getAttribute(r.dataIdAttr) || tn(t));
    return e;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(e, t) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(a, r) {
      var l = o.children[r];
      W(l, this.options.draggable, o, !1) && (i[a] = l);
    }, this), t && this.captureAnimationState(), e.forEach(function(a) {
      i[a] && (o.removeChild(i[a]), o.appendChild(i[a]));
    }), t && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var e = this.options.store;
    e && e.set && e.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(e, t) {
    return W(e, t || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(e, t) {
    var i = this.options;
    if (t === void 0)
      return i[e];
    var o = Ze.modifyOption(this, e, t);
    typeof o < "u" ? i[e] = o : i[e] = t, e === "group" && Xi(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    P("destroy", this);
    var e = this.el;
    e[N] = null, w(e, "mousedown", this._onTapStart), w(e, "touchstart", this._onTapStart), w(e, "pointerdown", this._onTapStart), this.nativeDraggable && (w(e, "dragover", this), w(e, "dragenter", this)), Array.prototype.forEach.call(e.querySelectorAll("[draggable]"), function(t) {
      t.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), ft.splice(ft.indexOf(this.el), 1), this.el = e = null;
  },
  _hideClone: function() {
    if (!oe) {
      if (P("hideClone", this), b.eventCanceled) return;
      v(D, "display", "none"), this.options.removeCloneOnHide && D.parentNode && D.parentNode.removeChild(D), oe = !0;
    }
  },
  _showClone: function(e) {
    if (e.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (oe) {
      if (P("showClone", this), b.eventCanceled) return;
      f.parentNode == E && !this.options.group.revertClone ? E.insertBefore(D, f) : fe ? E.insertBefore(D, fe) : E.appendChild(D), this.options.group.revertClone && this.animate(f, D), v(D, "display", ""), oe = !1;
    }
  }
};
function Yo(n) {
  n.dataTransfer && (n.dataTransfer.dropEffect = "move"), n.cancelable && n.preventDefault();
}
function ot(n, e, t, i, o, a, r, l) {
  var s, c = n[N], u = c.options.onMove, d;
  return window.CustomEvent && !Z && !Qe ? s = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (s = document.createEvent("Event"), s.initEvent("move", !0, !0)), s.to = e, s.from = n, s.dragged = t, s.draggedRect = i, s.related = o || e, s.relatedRect = a || C(e), s.willInsertAfter = l, s.originalEvent = r, n.dispatchEvent(s), u && (d = u.call(c, s, r)), d;
}
function It(n) {
  n.draggable = !1;
}
function Go() {
  Ft = !1;
}
function Qo(n, e, t) {
  var i = C(Ae(t.el, 0, t.options, !0)), o = qi(t.el, t.options, y), a = 10;
  return e ? n.clientX < o.left - a || n.clientY < i.top && n.clientX < i.right : n.clientY < o.top - a || n.clientY < i.bottom && n.clientX < i.left;
}
function Zo(n, e, t) {
  var i = C(Qt(t.el, t.options.draggable)), o = qi(t.el, t.options, y), a = 10;
  return e ? n.clientX > o.right + a || n.clientY > i.bottom && n.clientX > i.left : n.clientY > o.bottom + a || n.clientX > i.right && n.clientY > i.top;
}
function Jo(n, e, t, i, o, a, r, l) {
  var s = i ? n.clientY : n.clientX, c = i ? t.height : t.width, u = i ? t.top : t.left, d = i ? t.bottom : t.right, p = !1;
  if (!r) {
    if (l && st < c * o) {
      if (!je && (qe === 1 ? s > u + c * a / 2 : s < d - c * a / 2) && (je = !0), je)
        p = !0;
      else if (qe === 1 ? s < u + st : s > d - st)
        return -qe;
    } else if (s > u + c * (1 - o) / 2 && s < d - c * (1 - o) / 2)
      return en(e);
  }
  return p = p || r, p && (s < u + c * a / 2 || s > d - c * a / 2) ? s > u + c / 2 ? 1 : -1 : 0;
}
function en(n) {
  return U(f) < U(n) ? 1 : -1;
}
function tn(n) {
  for (var e = n.tagName + n.className + n.src + n.href + n.textContent, t = e.length, i = 0; t--; )
    i += e.charCodeAt(t);
  return i.toString(36);
}
function on(n) {
  gt.length = 0;
  for (var e = n.getElementsByTagName("input"), t = e.length; t--; ) {
    var i = e[t];
    i.checked && gt.push(i);
  }
}
function lt(n) {
  return setTimeout(n, 0);
}
function zt(n) {
  return clearTimeout(n);
}
xt && x(document, "touchmove", function(n) {
  (b.active || Se) && n.cancelable && n.preventDefault();
});
b.utils = {
  on: x,
  off: w,
  css: v,
  find: Hi,
  is: function(e, t) {
    return !!W(e, t, e, !1);
  },
  extend: Fo,
  throttle: Ui,
  closest: W,
  toggleClass: B,
  clone: Wi,
  index: U,
  nextTick: lt,
  cancelNextTick: zt,
  detectDirection: Vi,
  getChild: Ae,
  expando: N
};
b.get = function(n) {
  return n[N];
};
b.mount = function() {
  for (var n = arguments.length, e = new Array(n), t = 0; t < n; t++)
    e[t] = arguments[t];
  e[0].constructor === Array && (e = e[0]), e.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (b.utils = V(V({}, b.utils), i.utils)), Ze.mount(i);
  });
};
b.create = function(n, e) {
  return new b(n, e);
};
b.version = No;
var T = [], Fe, Bt, Ht = !1, Mt, Pt, mt, ze;
function nn() {
  function n() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var e in this)
      e.charAt(0) === "_" && typeof this[e] == "function" && (this[e] = this[e].bind(this));
  }
  return n.prototype = {
    dragStarted: function(t) {
      var i = t.originalEvent;
      this.sortable.nativeDraggable ? x(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? x(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? x(document, "touchmove", this._handleFallbackAutoScroll) : x(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(t) {
      var i = t.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? w(document, "dragover", this._handleAutoScroll) : (w(document, "pointermove", this._handleFallbackAutoScroll), w(document, "touchmove", this._handleFallbackAutoScroll), w(document, "mousemove", this._handleFallbackAutoScroll)), xi(), ct(), zo();
    },
    nulling: function() {
      mt = Bt = Fe = Ht = ze = Mt = Pt = null, T.length = 0;
    },
    _handleFallbackAutoScroll: function(t) {
      this._handleAutoScroll(t, !0);
    },
    _handleAutoScroll: function(t, i) {
      var o = this, a = (t.touches ? t.touches[0] : t).clientX, r = (t.touches ? t.touches[0] : t).clientY, l = document.elementFromPoint(a, r);
      if (mt = t, i || this.options.forceAutoScrollFallback || Qe || Z || Ue) {
        Nt(t, this.options, l, i);
        var s = ae(l, !0);
        Ht && (!ze || a !== Mt || r !== Pt) && (ze && xi(), ze = setInterval(function() {
          var c = ae(document.elementFromPoint(a, r), !0);
          c !== s && (s = c, ct()), Nt(t, o.options, c, i);
        }, 10), Mt = a, Pt = r);
      } else {
        if (!this.options.bubbleScroll || ae(l, !0) === j()) {
          ct();
          return;
        }
        Nt(t, this.options, ae(l, !1), !1);
      }
    }
  }, Q(n, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function ct() {
  T.forEach(function(n) {
    clearInterval(n.pid);
  }), T = [];
}
function xi() {
  clearInterval(ze);
}
var Nt = Ui(function(n, e, t, i) {
  if (e.scroll) {
    var o = (n.touches ? n.touches[0] : n).clientX, a = (n.touches ? n.touches[0] : n).clientY, r = e.scrollSensitivity, l = e.scrollSpeed, s = j(), c = !1, u;
    Bt !== t && (Bt = t, ct(), Fe = e.scroll, u = e.scrollFn, Fe === !0 && (Fe = ae(t, !0)));
    var d = 0, p = Fe;
    do {
      var g = p, h = C(g), m = h.top, S = h.bottom, A = h.left, $ = h.right, R = h.width, F = h.height, se = void 0, q = void 0, le = g.scrollWidth, Ce = g.scrollHeight, z = v(g), Oe = g.scrollLeft, J = g.scrollTop;
      g === s ? (se = R < le && (z.overflowX === "auto" || z.overflowX === "scroll" || z.overflowX === "visible"), q = F < Ce && (z.overflowY === "auto" || z.overflowY === "scroll" || z.overflowY === "visible")) : (se = R < le && (z.overflowX === "auto" || z.overflowX === "scroll"), q = F < Ce && (z.overflowY === "auto" || z.overflowY === "scroll"));
      var Le = se && (Math.abs($ - o) <= r && Oe + R < le) - (Math.abs(A - o) <= r && !!Oe), X = q && (Math.abs(S - a) <= r && J + F < Ce) - (Math.abs(m - a) <= r && !!J);
      if (!T[d])
        for (var ce = 0; ce <= d; ce++)
          T[ce] || (T[ce] = {});
      (T[d].vx != Le || T[d].vy != X || T[d].el !== g) && (T[d].el = g, T[d].vx = Le, T[d].vy = X, clearInterval(T[d].pid), (Le != 0 || X != 0) && (c = !0, T[d].pid = setInterval((function() {
        i && this.layer === 0 && b.active._onTouchMove(mt);
        var Ie = T[this.layer].vy ? T[this.layer].vy * l : 0, ee = T[this.layer].vx ? T[this.layer].vx * l : 0;
        typeof u == "function" && u.call(b.dragged.parentNode[N], ee, Ie, n, mt, T[this.layer].el) !== "continue" || Ki(T[this.layer].el, ee, Ie);
      }).bind({
        layer: d
      }), 24))), d++;
    } while (e.bubbleScroll && p !== s && (p = ae(p, !1)));
    Ht = c;
  }
}, 30), Qi = function(e) {
  var t = e.originalEvent, i = e.putSortable, o = e.dragEl, a = e.activeSortable, r = e.dispatchSortableEvent, l = e.hideGhostForTarget, s = e.unhideGhostForTarget;
  if (t) {
    var c = i || a;
    l();
    var u = t.changedTouches && t.changedTouches.length ? t.changedTouches[0] : t, d = document.elementFromPoint(u.clientX, u.clientY);
    s(), c && !c.el.contains(d) && (r("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function Zt() {
}
Zt.prototype = {
  startIndex: null,
  dragStart: function(e) {
    var t = e.oldDraggableIndex;
    this.startIndex = t;
  },
  onSpill: function(e) {
    var t = e.dragEl, i = e.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var o = Ae(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(t, o) : this.sortable.el.appendChild(t), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: Qi
};
Q(Zt, {
  pluginName: "revertOnSpill"
});
function Jt() {
}
Jt.prototype = {
  onSpill: function(e) {
    var t = e.dragEl, i = e.putSortable, o = i || this.sortable;
    o.captureAnimationState(), t.parentNode && t.parentNode.removeChild(t), o.animateAll();
  },
  drop: Qi
};
Q(Jt, {
  pluginName: "removeOnSpill"
});
b.mount(new nn());
b.mount(Jt, Zt);
function be(n) {
  var t, i;
  return ((i = (t = n.modules) == null ? void 0 : t._meta) == null ? void 0 : i.type) ?? "area";
}
function Zi(n) {
  return n === "floor" ? ["root"] : ["root", "floor", "area"];
}
function an(n, e) {
  return Zi(n).includes(e);
}
function rn(n) {
  const { locations: e, locationId: t, newParentId: i } = n;
  if (i === t || i && dt(e, t, i)) return !1;
  const o = new Map(e.map((s) => [s.id, s])), a = o.get(t);
  if (!a) return !1;
  const r = be(a);
  if (r === "floor") {
    const s = e.find((c) => c.is_explicit_root);
    return s ? i === s.id : i === null;
  }
  const l = i === null ? "root" : be(o.get(i) ?? {});
  return an(r, l);
}
function dt(n, e, t) {
  if (e === t) return !1;
  const i = new Map(n.map((r) => [r.id, r]));
  let o = i.get(t);
  const a = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === e || a.has(o.parent_id)) return !0;
    a.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
function Si(n, e) {
  const t = /* @__PURE__ */ new Map();
  for (const a of n) {
    const r = a.parent_id;
    t.has(r) || t.set(r, []), t.get(r).push(a);
  }
  const i = [];
  function o(a, r) {
    const l = t.get(a) || [];
    for (const s of l) {
      const u = (t.get(s.id) || []).length > 0, d = e.has(s.id);
      i.push({ location: s, depth: r, hasChildren: u, isExpanded: d }), d && u && o(s.id, r + 1);
    }
  }
  return o(null, 0), i;
}
function sn(n, e) {
  const t = /* @__PURE__ */ new Set([e]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of n) {
      const a = o.location.parent_id;
      a && t.has(a) && !t.has(o.location.id) && (t.add(o.location.id), i = !0);
    }
  }
  return t;
}
function ln(n, e, t, i, o, a) {
  const l = sn(n, e), s = n.filter((h) => !l.has(h.location.id));
  let c = o;
  const u = a != null && a.relatedId ? s.find((h) => h.location.id === a.relatedId) : void 0;
  u && (u.location.id === o ? c = u.location.parent_id : be(u.location) === "floor" ? (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX < a.relatedLeft + 10 ? c = u.location.parent_id : c = u.location.id : (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX < a.relatedLeft + 10 ? c = u.location.parent_id : (a == null ? void 0 : a.pointerX) !== void 0 && (a == null ? void 0 : a.relatedLeft) !== void 0 && a.pointerX >= a.relatedLeft + 10 || u.isExpanded && (a != null && a.willInsertAfter) ? c = u.location.id : c = u.location.parent_id);
  const d = s.filter((h) => h.location.parent_id === c);
  if (u) {
    if (c === u.location.id)
      return { parentId: c, siblingIndex: d.length };
    const h = d.findIndex(
      (m) => m.location.id === u.location.id
    );
    if (h >= 0) {
      const m = a != null && a.willInsertAfter ? h + 1 : h;
      return { parentId: c, siblingIndex: Math.max(0, Math.min(m, d.length)) };
    }
  }
  const p = Math.max(
    0,
    Math.min(
      i > t ? i - l.size : i,
      s.length
    )
  ), g = s.slice(0, p).filter((h) => h.location.parent_id === c).length;
  return { parentId: c, siblingIndex: g };
}
const _t = class _t extends Y {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveDropContextFromPointer(e, t, i) {
    var r;
    if (i === void 0) return;
    const o = Array.from(
      ((r = this.shadowRoot) == null ? void 0 : r.querySelectorAll(".tree-item[data-id]")) || []
    );
    let a;
    for (const l of o) {
      const s = l.getAttribute("data-id") || void 0;
      if (!s || s === e || dt(this.locations, e, s)) continue;
      const c = l.getBoundingClientRect(), u = c.top + c.height / 2, d = Math.abs(i - u);
      (!a || d < a.dist) && (a = { id: s, left: c.left, centerY: u, dist: d });
    }
    if (a)
      return {
        relatedId: a.id,
        relatedLeft: a.left,
        pointerX: t,
        willInsertAfter: i >= a.centerY
      };
  }
  _resolveRelatedId(e) {
    var r, l, s;
    const t = ((r = e.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, i = e.related;
    if (!t || !(i != null && i.classList.contains("tree-item"))) return;
    const o = (l = e.originalEvent) == null ? void 0 : l.clientY;
    if (o !== void 0) {
      const c = Array.from(
        ((s = this.shadowRoot) == null ? void 0 : s.querySelectorAll(".tree-item[data-id]")) || []
      );
      let u, d = Number.POSITIVE_INFINITY;
      for (const p of c) {
        const g = p.getAttribute("data-id") || void 0;
        if (!g || g === t || dt(this.locations, t, g))
          continue;
        const h = p.getBoundingClientRect(), m = h.top + h.height / 2, S = Math.abs(o - m);
        S < d && (d = S, u = g);
      }
      if (u) return u;
    }
    let a = i;
    for (; a; ) {
      if (a.classList.contains("tree-item")) {
        const c = a.getAttribute("data-id") || void 0;
        if (c && c !== t && !dt(this.locations, t, c))
          return c;
      }
      a = e.willInsertAfter ? a.nextElementSibling : a.previousElementSibling;
    }
  }
  willUpdate(e) {
    super.willUpdate(e), e.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  updated(e) {
    super.updated(e), (e.has("locations") || e.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const e = /* @__PURE__ */ new Set();
    for (const t of this.locations)
      t.parent_id && e.add(t.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = new Set(e), this._hasInitializedExpansion = !0;
    else
      for (const t of e)
        if (!this._expandedIds.has(t)) {
          const i = new Set(this._expandedIds);
          i.add(t), this._expandedIds = i;
        }
  }
  _initializeSortable() {
    var e;
    (e = this._sortable) == null || e.destroy(), this.updateComplete.then(() => {
      var i;
      const t = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      t && (this._sortable = b.create(t, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; floors are non-draggable via disabled handle.
        draggable: ".tree-item",
        onStart: () => {
          this._isDragging = !0;
        },
        onMove: (o) => {
          var l, s;
          const a = o.related;
          if (a != null && a.classList.contains("tree-item")) {
            const c = this._resolveRelatedId(o), d = ((c ? (l = this.shadowRoot) == null ? void 0 : l.querySelector(
              `.tree-item[data-id="${c}"]`
            ) : null) || a).getBoundingClientRect();
            this._lastDropContext = {
              relatedId: c ?? a.getAttribute("data-id") ?? void 0,
              willInsertAfter: o.willInsertAfter,
              pointerX: (s = o.originalEvent) == null ? void 0 : s.clientX,
              relatedLeft: d.left
            };
          }
          const r = a;
          if (r && r.classList.contains("tree-item")) {
            const c = r.getAttribute("data-id");
            c && !this._expandedIds.has(c) && (this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._autoExpandTimer = window.setTimeout(() => {
              const u = new Set(this._expandedIds);
              u.add(c), this._expandedIds = u;
            }, 800));
          }
          return !0;
        },
        onEnd: (o) => {
          this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._isDragging = !1, this._handleDragEnd(o), this._lastDropContext = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(e) {
    var S, A;
    const { item: t, newIndex: i, oldIndex: o } = e;
    if (i === void 0 || o === void 0) return;
    const a = t.getAttribute("data-id");
    if (!a) return;
    const r = this.locations.find(($) => $.id === a);
    if (!r) return;
    const l = (S = e.originalEvent) == null ? void 0 : S.clientX, s = (A = e.originalEvent) == null ? void 0 : A.clientY, u = this._resolveDropContextFromPointer(a, l, s) || this._lastDropContext, d = Si(this.locations, this._expandedIds), p = ln(
      d,
      a,
      o,
      i,
      r.parent_id,
      u
    ), g = p.parentId, h = p.siblingIndex, m = d.slice(0, o).filter(($) => $.location.parent_id === r.parent_id).length;
    if (g === r.parent_id && h === m) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!rn({ locations: this.locations, locationId: a, newParentId: g })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: a, newParentId: g, newIndex: h },
      bubbles: !0,
      composed: !0
    }));
  }
  _restoreTreeAfterCancelledDrop() {
    this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!e) return;
    const t = Array.from(e.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const a of t) {
      const r = a.getAttribute("data-id");
      if (r) {
        if (i.has(r)) {
          a.remove();
          continue;
        }
        i.add(r);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return _`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus"></ha-icon>
          <div>
            ${this.readOnly ? "No synced locations yet. Create Areas/Floors in Home Assistant Settings." : "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? "" : _`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const e = Si(this.locations, this._expandedIds), t = this._computeOccupancyStatusByLocation();
    return _`
      <div class="tree-list">
        ${Lo(
      e,
      (i) => `${this.version}:${i.location.id}:${i.depth}`,
      (i) => this._renderItem(
        i,
        t[i.location.id] || "unknown"
      )
    )}
      </div>
    `;
  }
  _renderItem(e, t) {
    const { location: i, depth: o, hasChildren: a, isExpanded: r } = e, l = this.selectedId === i.id, s = this._editingId === i.id, c = o * 24, u = be(i);
    return _`
      <div
        class="tree-item ${l ? "selected" : ""} ${u === "floor" ? "floor-item" : ""}"
        data-id=${i.id}
        style="margin-left: ${c}px"
        @click=${(d) => this._handleClick(d, i)}
      >
        <div
          class="drag-handle ${u === "floor" || this.readOnly ? "disabled" : ""}"
          title=${this.readOnly ? "Topology structure is managed in Home Assistant Settings." : u === "floor" ? "Floors are fixed at top level" : "Drag to reorder or move levels."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${r ? "expanded" : ""} ${a ? "" : "hidden"}"
          @click=${(d) => this._handleExpand(d, i.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(i)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${t}"
          title=${this._getOccupancyStatusLabel(t)}
        ></div>

        ${s ? _`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(d) => this._editingValue = d.target.value}
                  @blur=${() => this._finishEditing(i.id)}
                  @keydown=${(d) => this._handleEditKeydown(d, i.id)}
                  @click=${(d) => d.stopPropagation()} />` : _`<div
              class="location-name"
              @dblclick=${this.readOnly ? () => {
    } : (d) => this._startEditing(d, i)}
            >${i.name}</div>`}

        <span class="type-badge ${u}">${u}</span>

        ${this.readOnly ? "" : _`<button class="delete-btn" @click=${(d) => this._handleDelete(d, i)} title="Delete"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`}
      </div>
    `;
  }
  _getOccupancyStatusLabel(e) {
    return e === "occupied" ? "Occupied" : e === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const e = {}, t = new Map(this.locations.map((r) => [r.id, r])), i = /* @__PURE__ */ new Map();
    for (const r of this.locations)
      r.parent_id && (i.has(r.parent_id) || i.set(r.parent_id, []), i.get(r.parent_id).push(r.id));
    const o = /* @__PURE__ */ new Map(), a = (r) => {
      var g;
      const l = o.get(r);
      if (l) return l;
      if (!t.has(r)) return "unknown";
      const s = (g = this.occupancyStates) == null ? void 0 : g[r], c = s === !0 ? "occupied" : s === !1 ? "vacant" : "unknown", u = i.get(r) || [];
      if (!u.length)
        return o.set(r, c), c;
      const d = u.map((h) => a(h));
      let p;
      return c === "occupied" || d.includes("occupied") ? p = "occupied" : c === "vacant" || d.length > 0 && d.every((h) => h === "vacant") ? p = "vacant" : p = "unknown", o.set(r, p), p;
    };
    for (const r of this.locations)
      e[r.id] = a(r.id);
    return e;
  }
  _getIcon(e) {
    var i, o, a;
    return e.ha_area_id && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e.ha_area_id]) != null && a.icon) ? this.hass.areas[e.ha_area_id].icon : be(e) === "floor" ? "mdi:layers" : "mdi:map-marker";
  }
  _handleClick(e, t) {
    const i = e.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".delete-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: t.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(e, t) {
    e.stopPropagation();
    const i = new Set(this._expandedIds);
    i.has(t) ? i.delete(t) : i.add(t), this._expandedIds = i;
  }
  _startEditing(e, t) {
    this.readOnly || (e.stopPropagation(), this._editingId = t.id, this._editingValue = t.name, this.updateComplete.then(() => {
      var o;
      const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    }));
  }
  _handleEditKeydown(e, t) {
    e.key === "Enter" ? (e.preventDefault(), this._finishEditing(t)) : e.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(e) {
    var i;
    if (this._editingId !== e) return;
    const t = this._editingValue.trim();
    this._editingId = void 0, !(!t || t === ((i = this.locations.find((o) => o.id === e)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: e, newName: t }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(e, t) {
    this.readOnly || (e.stopPropagation(), confirm(`Delete "${t.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: t }, bubbles: !0, composed: !0 })));
  }
  _handleCreate() {
    this.readOnly || this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
};
_t.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  occupancyStates: { attribute: !1 },
  readOnly: { type: Boolean },
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 }
}, _t.styles = [
  Ge,
  ke`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .tree-item.floor-item .drag-handle {
        opacity: 0.12;
        cursor: not-allowed;
      }

      .tree-item.floor-item:hover .drag-handle {
        opacity: 0.18;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .delete-btn {
        opacity: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 0.6;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `
];
let Ut = _t;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Ut);
function cn(n) {
  const e = n.toLowerCase(), t = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"]
  }, i = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater"
  };
  for (const [o, a] of Object.entries(t))
    if (a.some((r) => e.includes(r)))
      return i[o] ?? null;
  return null;
}
function dn(n) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker"
  }[n] ?? "mdi:map-marker";
}
function un(n) {
  var o;
  const e = (o = n.modules) == null ? void 0 : o._meta;
  if (e != null && e.icon) return String(e.icon);
  const t = cn(n.name);
  if (t) return t;
  const i = (e == null ? void 0 : e.type) ?? "area";
  return dn(i);
}
const ne = 30 * 60, $i = 5 * 60;
function Ji(n) {
  if (!n) return "";
  const e = n.indexOf(".");
  return e >= 0 ? n.slice(0, e) : "";
}
function hn(n) {
  return ["door", "garage_door", "opening", "window"].includes(n || "");
}
function pn(n) {
  return ["presence", "occupancy"].includes(n || "");
}
function fn(n) {
  return n === "motion";
}
function eo(n) {
  return n === "media_player";
}
function to(n) {
  var i;
  const e = Ji(n == null ? void 0 : n.entity_id), t = (i = n == null ? void 0 : n.attributes) == null ? void 0 : i.device_class;
  if (eo(e))
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ne,
      off_event: "none",
      off_trailing: 0
    };
  if (e === "light" || e === "switch")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ne,
      off_event: "none",
      off_trailing: 0
    };
  if (e === "person" || e === "device_tracker")
    return {
      entity_id: (n == null ? void 0 : n.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: $i
    };
  if (e === "binary_sensor") {
    if (pn(t))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: $i
      };
    if (fn(t))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ne,
        off_event: "none",
        off_trailing: 0
      };
    if (hn(t))
      return {
        entity_id: (n == null ? void 0 : n.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ne,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (n == null ? void 0 : n.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: ne,
    off_event: "none",
    off_trailing: 0
  };
}
function gn(n, e, t) {
  const i = Ji(t == null ? void 0 : t.entity_id), o = to(t);
  if (eo(i)) {
    const r = n.on_timeout && n.on_timeout > 0 ? n.on_timeout : ne;
    return {
      ...n,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (e === "any_change") {
    const r = n.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : ne);
    return {
      ...n,
      mode: e,
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  const a = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: ne,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...n,
    mode: e,
    on_event: n.on_event ?? a.on_event,
    on_timeout: n.on_timeout ?? a.on_timeout,
    off_event: n.off_event ?? a.off_event,
    off_trailing: n.off_trailing ?? a.off_trailing
  };
}
console.log("[ht-location-inspector] module loaded");
var Di, Ai;
try {
  (Ai = (Di = import.meta) == null ? void 0 : Di.hot) == null || Ai.accept(() => window.location.reload());
} catch {
}
const vt = class vt extends Y {
  constructor() {
    super(...arguments), this._activeTab = "occupancy", this._sourcesDirty = !1, this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {}, this._discardSourceChanges = () => {
      this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate();
    }, this._saveSourceChanges = async () => {
      !this.location || !this._stagedSources || !this._sourcesDirty || (await this._persistOccupancySources(this._stagedSources), this._stagedSources = void 0, this._sourcesDirty = !1, this.requestUpdate(), this._showToast("Saved source changes", "success"));
    };
  }
  render() {
    return this.location ? _`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()} ${this._renderContent()}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(e) {
    var t;
    if (e.has("location")) {
      const i = e.get("location"), o = (i == null ? void 0 : i.id) || "", a = ((t = this.location) == null ? void 0 : t.id) || "";
      o !== a && (this._stagedSources = void 0, this._sourcesDirty = !1, this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {});
    }
  }
  _renderHeader() {
    if (!this.location) return "";
    const e = this.location.ha_area_id, t = e ? "HA Area ID:" : "Location ID:", i = e || this.location.id;
    return _`
      <div class="header">
        <div class="header-icon">
          <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
        </div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">
            <span class="id-label">${t}</span>${i}
          </div>
        </div>
      </div>
    `;
  }
  _headerIcon(e) {
    var i, o, a;
    const t = e.ha_area_id;
    return t && ((a = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[t]) != null && a.icon) ? this.hass.areas[t].icon : un(e);
  }
  _renderTabs() {
    return _`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "occupancy" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "occupancy", this.requestUpdate();
    }}
        >
          Occupancy
        </button>
        <button
          class="tab ${this._activeTab === "actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "actions", this.requestUpdate();
    }}
        >
          Actions
        </button>
      </div>
    `;
  }
  _renderContent() {
    return _`
      <div class="tab-content">
        ${this._activeTab === "occupancy" ? this._renderOccupancyTab() : this._renderActionsTab()}
      </div>
    `;
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const e = this.location.modules.occupancy || {}, t = this._isFloorLocation(), i = (e.occupancy_sources || []).length, o = this._getLockState();
    return t ? _`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${i > 0 ? _`
                <div class="policy-warning">
                  This floor still has ${i} legacy source${i === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              ` : ""}
        </div>
      ` : _`
      <div>
        <div class="card-section">
          ${o.isLocked ? _`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${o.lockedBy.length ? _`Held by ${o.lockedBy.join(", ")}.` : _`Occupancy is currently held by a lock.`}
              </div>
            </div>
          ` : ""}
          <div class="section-title">
            Sources
          </div>
          <div class="subsection-help">
            Use the left control to include a source. Included sources show editable behavior below.
          </div>
          ${this._renderAreaSensorList(e)}
          <div class="subsection-help">
            Need cross-area behavior? Add a source from another area.
          </div>
          ${this._renderExternalSourceComposer(e)}
          ${this._sourcesDirty ? _`
            <div class="editor-actions sources-actions">
              <button
                class="button button-secondary"
                ?disabled=${this._savingSource}
                @click=${this._discardSourceChanges}
              >
                Discard
              </button>
              <button
                class="button button-primary"
                ?disabled=${this._savingSource}
                @click=${this._saveSourceChanges}
              >
                Save
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
  _isMediaEntity(e) {
    return e.startsWith("media_player.");
  }
  _mediaSignalLabel(e) {
    return e === "color" ? "Color change" : e === "power" ? "Power" : e === "level" ? "Level change" : e === "volume" ? "Volume" : e === "mute" ? "Mute" : "Playback";
  }
  _signalDescription(e) {
    return e === "color" ? "RGB/color changes" : e === "power" ? "on/off" : e === "level" ? "brightness changes" : e === "volume" ? "volume changes" : e === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(e, t) {
    return t ? `${e}::${t}` : e;
  }
  _sourceKeyFromSource(e) {
    return e.signal_key ? this._sourceKey(e.entity_id, e.signal_key) : this._sourceKey(e.entity_id);
  }
  _defaultSignalKeyForEntity(e) {
    if (this._isMediaEntity(e)) return "playback";
    if (this._isDimmableEntity(e) || this._isColorCapableEntity(e)) return "power";
  }
  _candidateItemsForEntity(e) {
    if (!this._isMediaEntity(e)) {
      const t = this._isDimmableEntity(e), i = this._isColorCapableEntity(e);
      if (!t && !i)
        return [{ key: this._sourceKey(e), entityId: e }];
      const o = ["power"];
      return t && o.push("level"), i && o.push("color"), o.map((a) => ({
        key: this._sourceKey(e, a),
        entityId: e,
        signalKey: a
      }));
    }
    return ["playback", "volume", "mute"].map((t) => ({
      key: this._sourceKey(e, t),
      entityId: e,
      signalKey: t
    }));
  }
  _candidateTitle(e, t) {
    const i = this._entityName(e);
    return t && (e.startsWith("media_player.") || e.startsWith("light.")) ? `${i} — ${this._mediaSignalLabel(t)}` : !this._isMediaEntity(e) && !this._isDimmableEntity(e) && !this._isColorCapableEntity(e) ? i : `${i} — ${this._mediaSignalLabel(t)}`;
  }
  _mediaSignalDefaults(e, t) {
    return t === "playback" ? {
      entity_id: e,
      source_id: this._sourceKey(e, "playback"),
      signal_key: "playback",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: e,
      source_id: this._sourceKey(e, t),
      signal_key: t,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _lightSignalDefaults(e, t) {
    return t === "power" ? {
      entity_id: e,
      source_id: this._sourceKey(e, "power"),
      signal_key: "power",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : t === "color" ? {
      entity_id: e,
      source_id: this._sourceKey(e, "color"),
      signal_key: "color",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: e,
      source_id: this._sourceKey(e, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _isDimmableEntity(e) {
    var r, l;
    const t = (l = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : l[e];
    if (!t || e.split(".", 1)[0] !== "light") return !1;
    const o = t.attributes || {};
    if (typeof o.brightness == "number") return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((s) => s && s !== "onoff") : !1;
  }
  _isColorCapableEntity(e) {
    var r, l;
    const t = (l = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : l[e];
    if (!t || e.split(".", 1)[0] !== "light") return !1;
    const o = t.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const a = o.supported_color_modes;
    return Array.isArray(a) ? a.some((s) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(s)) : !1;
  }
  _renderAreaSensorList(e) {
    if (!this.location) return "";
    const t = this._workingSources(e), i = /* @__PURE__ */ new Map();
    t.forEach((u, d) => i.set(this._sourceKeyFromSource(u), d));
    const o = [...this.location.entity_ids || []].sort(
      (u, d) => this._entityName(u).localeCompare(this._entityName(d))
    );
    new Set(o);
    const r = o.filter((u) => this._isCandidateEntity(u)).flatMap((u) => this._candidateItemsForEntity(u)), l = new Set(r.map((u) => u.key)), s = t.filter((u) => !l.has(this._sourceKeyFromSource(u))).map((u) => ({
      key: this._sourceKeyFromSource(u),
      entityId: u.entity_id,
      signalKey: u.signal_key
    })), c = [...r, ...s];
    return c.length ? _`
      <div class="candidate-list">
        ${c.map((u) => {
      const d = i.get(u.key), p = d !== void 0, g = p ? t[d] : void 0, h = p && g ? g : void 0, m = this._modeOptionsForEntity(u.entityId);
      return _`
            <div class="source-card ${p ? "enabled" : ""}">
              <div class="candidate-item">
                <div class="source-enable-control">
                  <input
                    type="checkbox"
                    class="source-enable-input"
                    aria-label="Include source"
                    .checked=${p}
                    @change=${(S) => {
        const A = S.target.checked;
        A && !p ? this._addSourceWithDefaults(u.entityId, e, {
          resetExternalPicker: !1,
          signalKey: u.signalKey
        }) : !A && p && this._removeSource(d, e);
      }}
                  />
                </div>
                <div>
                  <div class="candidate-headline">
                    <div class="candidate-title">${this._candidateTitle(u.entityId, u.signalKey)}</div>
                    ${p && h && m.length > 1 ? _`
                          <div class="inline-mode-group">
                            <span class="inline-mode-label">Mode</span>
                            <select
                              class="inline-mode-select"
                              .value=${m.some((S) => S.value === h.mode) ? h.mode : m[0].value}
                              @change=${(S) => {
        const A = S.target.value, $ = this.hass.states[u.entityId], R = gn(h, A, $);
        this._updateSourceDraft(e, d, { ...R, entity_id: h.entity_id });
      }}
                            >
                              ${m.map((S) => _`<option value=${S.value}>${S.label}</option>`)}
                            </select>
                          </div>
                        ` : ""}
                  </div>
                  <div class="candidate-meta">${u.entityId} • ${this._entityState(u.entityId)}</div>
                  ${(this._isMediaEntity(u.entityId) || u.entityId.startsWith("light.")) && u.signalKey ? _`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(u.signalKey)}</div>` : ""}
                </div>
              </div>
              ${p && g ? this._renderSourceEditor(e, g, d) : ""}
            </div>
          `;
    })}
      </div>
    ` : _`
        <div class="empty-state">
          <div class="text-muted">
            No occupancy-relevant entities found yet.
            Add one from another area to get started.
          </div>
        </div>
      `;
  }
  _renderExternalSourceComposer(e) {
    const t = this._availableSourceAreas(), i = this._externalAreaId || "", o = i ? this._entitiesForArea(i) : [], a = this._externalEntityId || "", r = new Set(this._workingSources(e).map((c) => this._sourceKeyFromSource(c))), l = a ? this._defaultSignalKeyForEntity(a) : void 0, s = a ? this._sourceKey(a, l) : "";
    return _`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">Other Area</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${i}
            @change=${(c) => {
      const u = c.target.value;
      this._externalAreaId = u, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">Select area...</option>
            ${t.map((c) => _`<option value=${c.area_id}>${c.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${a}
            @change=${(c) => {
      this._externalEntityId = c.target.value, this.requestUpdate();
    }}
            ?disabled=${!i}
          >
            <option value="">Select sensor...</option>
            ${o.map((c) => _`
              <option
                value=${c}
                ?disabled=${r.has(this._sourceKey(c, this._defaultSignalKeyForEntity(c)))}
              >
                ${this._entityName(c)}${r.has(this._sourceKey(c, this._defaultSignalKeyForEntity(c))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !a || (s ? r.has(s) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(a, e, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(a)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderSourceEditor(e, t, i) {
    const o = t, a = this._eventLabelsForSource(t), r = this._sourceKeyFromSource(t), l = this._supportsOffBehavior(t), s = e.default_timeout || 300, c = this._onTimeoutMemory[r], u = o.on_timeout === null ? c ?? s : o.on_timeout ?? c ?? s, d = Math.max(1, Math.min(120, Math.round(u / 60))), p = o.off_trailing ?? 0, g = Math.max(0, Math.min(120, Math.round(p / 60)));
    return _`
      <div class="source-editor">
        ${(this._isMediaEntity(t.entity_id) || t.entity_id.startsWith("light.")) && t.signal_key ? _`<div class="media-signals">Signal: ${this._mediaSignalLabel(t.signal_key)} (${this._signalDescription(t.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <label for="source-on-event-${i}">${a.onBehavior}</label>
            <select
              id="source-on-event-${i}"
              .value=${o.on_event || "trigger"}
              @change=${(h) => {
      this._updateSourceDraft(e, i, {
        ...o,
        on_event: h.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${a.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @input=${(h) => {
      const m = Number(h.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: m * 60
      }, this._updateSourceDraft(e, i, { ...o, on_timeout: m * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @change=${(h) => {
      const m = Math.max(1, Math.min(120, Number(h.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: m * 60
      }, this._updateSourceDraft(e, i, { ...o, on_timeout: m * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${o.on_timeout === null}
                @change=${(h) => {
      const m = h.target.checked, S = this._onTimeoutMemory[r], A = d * 60, $ = S ?? A;
      m && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: o.on_timeout ?? $
      }), this._updateSourceDraft(e, i, {
        ...o,
        on_timeout: m ? null : $
      });
    }}
              />
              Indefinite (until ${a.offState})
            </label>
          </div>

          ${l ? _`
                <div class="editor-field">
                  <label for="source-off-event-${i}">${a.offBehavior}</label>
                  <select
                    id="source-off-event-${i}"
                    .value=${o.off_event || "none"}
                    @change=${(h) => {
      this._updateSourceDraft(e, i, {
        ...o,
        off_event: h.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${a.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(g)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @input=${(h) => {
      const m = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(e, i, { ...o, off_trailing: m * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(g)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @change=${(h) => {
      const m = Math.max(0, Math.min(120, Number(h.target.value) || 0));
      this._updateSourceDraft(e, i, { ...o, off_trailing: m * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              ` : ""}
        </div>
      </div>
    `;
  }
  _renderActionsTab() {
    if (!this.location) return "";
    const t = (this.location.modules.automation || {}).rules || [];
    return _`
      <div>
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            Automation Rules
          </div>

          <div class="rules-list">
            ${t.length === 0 ? _`
                  <div class="empty-state">
                    <div class="text-muted">No rules configured. Behavior is strictly manual.</div>
                  </div>
                ` : t.map(
      (i) => _`
                    <div class="source-item">
                      <div class="source-icon">
                        <ha-icon .icon=${"mdi:robot"}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${i.name}</div>
                        <div class="source-details">
                          When ${i.trigger_type} → ${i.action_service}
                        </div>
                      </div>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(i.id)}>
                        <ha-icon .icon=${"mdi:delete-outline"}></ha-icon>
                      </button>
                    </div>
                  `
    )}
          </div>

          <button
            class="button button-primary"
            style="margin-top: 16px;"
            @click=${this._handleAddRule}
          >
            + Add Rule
          </button>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            Rules trigger actions based on the occupancy state of this location.
            For example, you can automatically turn on lights when someone enters.
          </div>
        </div>
      </div>
    `;
  }
  _workingSources(e) {
    return this._stagedSources ? [...this._stagedSources] : [...e.occupancy_sources || []];
  }
  _setWorkingSources(e, t) {
    const i = t.map((a) => this._normalizeSource(a.entity_id, a)), o = { ...this._onTimeoutMemory };
    for (const a of i)
      typeof a.on_timeout == "number" && a.on_timeout > 0 && (o[this._sourceKeyFromSource(a)] = a.on_timeout);
    this._onTimeoutMemory = o, this._stagedSources = i, this._sourcesDirty = !0, this.requestUpdate();
  }
  _updateSourceDraft(e, t, i) {
    const o = this._workingSources(e), a = o[t];
    if (!a) return;
    const r = this._modeOptionsForEntity(a.entity_id).map((s) => s.value), l = this._normalizeSource(
      a.entity_id,
      {
        ...i,
        mode: r.includes(i.mode) ? i.mode : r[0]
      }
    );
    o[t] = l, this._setWorkingSources(e, o);
  }
  _removeSource(e, t) {
    const i = this._workingSources(t), o = i[e];
    if (!o) return;
    i.splice(e, 1);
    const a = { ...this._onTimeoutMemory };
    delete a[this._sourceKeyFromSource(o)], this._onTimeoutMemory = a, this._setWorkingSources(t, i);
  }
  _addSourceWithDefaults(e, t, i) {
    if (!this.location || this._isFloorLocation()) return;
    const o = this._workingSources(t), a = this._sourceKey(e, i == null ? void 0 : i.signalKey);
    if (o.some((u) => this._sourceKeyFromSource(u) === a))
      return;
    const r = this.hass.states[e];
    if (!r) {
      this._showToast(`Entity not found: ${e}`, "error");
      return;
    }
    let s = to(r);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? s = this._mediaSignalDefaults(e, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (s = this._lightSignalDefaults(e, i.signalKey));
    const c = this._normalizeSource(e, s);
    this._setWorkingSources(t, [...o, c]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate());
  }
  async _persistOccupancySources(e) {
    if (!this.location) return;
    const t = this._getOccupancyConfig();
    this._savingSource = !0, this.requestUpdate();
    try {
      await this._updateConfig({
        ...t,
        occupancy_sources: e
      });
    } finally {
      this._savingSource = !1, this.requestUpdate();
    }
  }
  _normalizeSource(e, t) {
    var d;
    const i = this._isMediaEntity(e), o = this._isDimmableEntity(e), a = this._isColorCapableEntity(e), r = (d = t.source_id) != null && d.includes("::") ? t.source_id.split("::")[1] : void 0, l = this._defaultSignalKeyForEntity(e), s = t.signal_key || r || l;
    let c;
    (i && (s === "playback" || s === "volume" || s === "mute") || (o || a) && (s === "power" || s === "level" || s === "color")) && (c = s);
    const u = t.source_id || this._sourceKey(e, c);
    return {
      entity_id: e,
      source_id: u,
      signal_key: c,
      mode: t.mode || "any_change",
      on_event: t.on_event || "trigger",
      on_timeout: t.on_timeout,
      off_event: t.off_event || "none",
      off_trailing: t.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    var e, t;
    return ((t = (e = this.location) == null ? void 0 : e.modules) == null ? void 0 : t.occupancy) || {};
  }
  _availableSourceAreas() {
    var o, a;
    const e = (o = this.location) == null ? void 0 : o.ha_area_id, t = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(t).filter((r) => !!r.area_id).filter((r) => r.area_id !== e).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, l) => r.name.localeCompare(l.name));
  }
  _entitiesForArea(e) {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {};
    return Object.keys(t).filter((o) => {
      var a, r;
      return ((r = (a = t[o]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === e;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, a) => this._entityName(o).localeCompare(this._entityName(a)));
  }
  _isCandidateEntity(e) {
    var a, r;
    const t = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[e];
    if (!t) return !1;
    const i = t.attributes || {};
    if (i.device_class === "occupancy" && i.location_id) return !1;
    const o = e.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o))
      return !0;
    if (o === "binary_sensor") {
      const l = String(i.device_class || "");
      return l ? [
        "motion",
        "occupancy",
        "presence",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock"
      ].includes(l) : !0;
    }
    return !1;
  }
  _getLockState() {
    var t;
    if (!this.location) return { isLocked: !1, lockedBy: [] };
    const e = ((t = this.hass) == null ? void 0 : t.states) || {};
    for (const i of Object.values(e)) {
      const o = (i == null ? void 0 : i.attributes) || {};
      if (o.device_class !== "occupancy" || o.location_id !== this.location.id) continue;
      const a = o.locked_by, r = Array.isArray(a) ? a.map((l) => String(l)) : [];
      return {
        isLocked: !!o.is_locked,
        lockedBy: r
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  _describeSource(e, t) {
    const i = e.mode === "any_change" ? "Any change" : "Specific states", o = e.on_timeout === null ? null : e.on_timeout ?? t, a = e.off_trailing ?? 0, r = e.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", l = e.off_event === "clear" ? `OFF: clear (${this._formatDuration(a)})` : "OFF: ignore";
    return `${i} • ${r} • ${l}`;
  }
  _renderSourceEventChips(e, t) {
    const i = [], o = e.on_timeout === null ? null : e.on_timeout ?? t, a = e.off_trailing ?? 0;
    return e.on_event === "trigger" ? i.push(_`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(_`<span class="event-chip ignore">ON ignored</span>`), e.off_event === "clear" ? i.push(
      _`<span class="event-chip off">OFF -> clear (${this._formatDuration(a)})</span>`
    ) : i.push(_`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(e) {
    var r, l;
    const t = (l = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : l[e], i = (t == null ? void 0 : t.attributes) || {}, o = e.split(".", 1)[0], a = String(i.device_class || "");
    return o === "person" || o === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : o === "binary_sensor" ? ["door", "garage_door", "opening", "window", "motion", "presence", "occupancy"].includes(a) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player", "climate", "cover", "vacuum"].includes(o) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(e) {
    const t = e.entity_id.split(".", 1)[0];
    return !(t === "media_player" && (e.signal_key === "volume" || e.signal_key === "mute") || t === "light" && (e.signal_key === "level" || e.signal_key === "color"));
  }
  _eventLabelsForSource(e) {
    var c, u;
    const t = e.entity_id, i = (u = (c = this.hass) == null ? void 0 : c.states) == null ? void 0 : u[t], o = (i == null ? void 0 : i.attributes) || {}, a = t.split(".", 1)[0], r = String(o.device_class || "");
    let l = "ON", s = "OFF";
    if (a === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(r))
      l = "Open", s = "Closed";
    else if (a === "binary_sensor" && r === "motion")
      l = "Motion", s = "No motion";
    else if (a === "binary_sensor" && ["presence", "occupancy"].includes(r))
      l = "Detected", s = "Not detected";
    else if (a === "person" || a === "device_tracker")
      l = "Home", s = "Away";
    else {
      if (a === "media_player")
        return e.signal_key === "volume" ? {
          onState: "Volume change",
          offState: "No volume change",
          onBehavior: "Volume change behavior",
          onTimeout: "Volume timeout",
          offBehavior: "No-volume behavior",
          offDelay: "No-volume delay"
        } : e.signal_key === "mute" ? {
          onState: "Mute change",
          offState: "No mute change",
          onBehavior: "Mute change behavior",
          onTimeout: "Mute timeout",
          offBehavior: "No-mute behavior",
          offDelay: "No-mute delay"
        } : {
          onState: "Playing",
          offState: "Paused/idle",
          onBehavior: "Playing behavior",
          onTimeout: "Playing timeout",
          offBehavior: "Paused/idle behavior",
          offDelay: "Paused/idle delay"
        };
      if (a === "light" && e.signal_key === "level")
        return {
          onState: "Level change",
          offState: "No level change",
          onBehavior: "Level change behavior",
          onTimeout: "Level timeout",
          offBehavior: "No-level behavior",
          offDelay: "No-level delay"
        };
      if (a === "light" && e.signal_key === "color")
        return {
          onState: "Color change",
          offState: "No color change",
          onBehavior: "Color change behavior",
          onTimeout: "Color timeout",
          offBehavior: "No-color behavior",
          offDelay: "No-color delay"
        };
      (a === "light" && e.signal_key === "power" || a === "light" || a === "switch" || a === "fan") && (l = "On", s = "Off");
    }
    return {
      onState: l,
      offState: s,
      onBehavior: `${l} behavior`,
      onTimeout: `${l} timeout`,
      offBehavior: `${s} behavior`,
      offDelay: `${s} delay`
    };
  }
  _formatDuration(e) {
    return e === null ? "indefinite" : !e || e <= 0 ? "0m" : `${Math.floor(e / 60)}m`;
  }
  _entityName(e) {
    var t, i;
    return ((i = (t = this.hass.states[e]) == null ? void 0 : t.attributes) == null ? void 0 : i.friendly_name) || e;
  }
  _entityState(e) {
    var i;
    const t = (i = this.hass.states[e]) == null ? void 0 : i.state;
    return t || "unknown";
  }
  async _handleTestSource(e, t) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (t === "trigger") {
          const a = (this.location.modules.occupancy || {}).default_timeout || 300, r = e.on_timeout === null ? a : e.on_timeout ?? a, l = e.source_id || e.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "home_topology",
            service: "trigger",
            service_data: {
              location_id: this.location.id,
              source_id: l,
              timeout: r
            }
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: l,
                timeout: r
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${l}`, "success");
          return;
        }
        const i = e.off_trailing ?? 0, o = e.source_id || e.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "home_topology",
          service: "clear",
          service_data: {
            location_id: this.location.id,
            source_id: o,
            trailing_timeout: i
          }
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "clear",
              locationId: this.location.id,
              sourceId: o,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), this._showToast(`Cleared ${o}`, "success");
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(e, t = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: e,
          type: t === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _handleAddRule() {
    this.dispatchEvent(new CustomEvent("add-rule", {
      bubbles: !0,
      composed: !0
    }));
  }
  async _handleDeleteRule(e) {
    if (!confirm("Are you sure you want to delete this rule?") || !this.location) return;
    const t = this.location.modules.automation || {}, o = (t.rules || []).filter((a) => a.id !== e);
    await this._updateModuleConfig("automation", { ...t, rules: o });
  }
  async _updateModuleConfig(e, t) {
    if (this.location)
      try {
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: e,
          config: t
        }), this.location.modules[e] = t, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(e) {
    if (!this.location || this._isFloorLocation()) return;
    const t = this.location.modules.occupancy || {}, i = !(t.enabled ?? !0);
    this._updateConfig({ ...t, enabled: i });
  }
  _handleTimeoutSliderInput(e) {
    const t = e.target, i = t.closest(".config-value");
    if (!i) return;
    const o = i.querySelector("input.input");
    o && (o.value = t.value);
  }
  _handleTimeoutChange(e) {
    const t = e.target, i = parseInt(t.value, 10);
    if (Number.isNaN(i)) return;
    const o = Math.max(1, Math.min(120, i));
    t.value = String(o);
    const a = o * 60, r = t.closest(".config-value");
    if (r) {
      const s = r.querySelector("input.timeout-slider");
      s && (s.value = String(o));
      const c = r.querySelector("input.input");
      c && (c.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const l = this.location.modules.occupancy || {};
    this._updateConfig({ ...l, default_timeout: a });
  }
  async _updateConfig(e) {
    await this._updateModuleConfig("occupancy", e);
  }
  _isFloorLocation() {
    return !!this.location && be(this.location) === "floor";
  }
};
vt.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 }
}, vt.styles = [
  Ge,
  ke`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .location-id {
        font-size: 13px;
        font-family: var(--code-font-family, monospace);
        color: var(--secondary-text-color);
        margin-top: 4px;
        opacity: 0.8;
      }

      .id-label {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 10px;
        margin-right: 4px;
        letter-spacing: 0.5px;
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-submeta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .candidate-headline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 10px 12px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }
      }
    `
];
let Kt = vt;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", Kt);
  } catch (n) {
    console.error("[ht-location-inspector] failed to define element", n);
  }
console.log("[ht-location-dialog] module loaded");
var ki, Ti;
try {
  (Ti = (ki = import.meta) == null ? void 0 : ki.hot) == null || Ti.accept(() => window.location.reload());
} catch {
}
const bt = class bt extends Y {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (e) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Area Icon (optional)"
    })[e.name] || e.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(e) {
    var t, i, o;
    if (e.has("open")) {
      const a = e.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", a, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((r) => {
        var l, s;
        return `${r.name}(${(s = (l = r.modules) == null ? void 0 : l._meta) == null ? void 0 : s.type})`;
      })), this.open && !a) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const r = ((t = this.location.modules) == null ? void 0 : t._meta) || {}, l = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: r.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: l || void 0
          };
        } else {
          const r = this.defaultType ?? "area", l = this.defaultParentId;
          this._config = {
            name: "",
            type: r,
            parent_id: l || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(e) {
    super.updated(e), e.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var o, a;
        const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (t != null && t.shadowRoot) {
          const r = t.shadowRoot.querySelector('input[type="text"]');
          if (r) {
            console.log("[LocationDialog] Focusing input:", r), r.focus(), r.select();
            return;
          }
        }
        const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const e = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", e.length, "fields"), _`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? _`
            <div class="error-message">${this._error}</div>
          ` : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${e}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const e = this._getValidParents(), t = this._includeRootOption();
    console.log("[LocationDialog] parentOptions:", e), this.location;
    const i = [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" }
            ]
          }
        }
      },
      {
        name: "parent_id",
        selector: {
          select: {
            options: [
              ...t ? [{ value: "", label: "(Root Level)" }] : [],
              ...e
            ]
          }
        }
      }
    ];
    return i.push({
      name: "icon",
      selector: { icon: {} }
    }), i;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Rooms are terminal (room → room blocked)
   * - Buildings/Outdoor are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const e = this._config.type;
    if (e === "floor") {
      const a = this.locations.find((r) => r.is_explicit_root);
      return a ? [{ value: a.id, label: a.name }] : [];
    }
    const t = Zi(e), i = t.filter((a) => a !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: e,
      allowedParentTypes: t,
      filteredTypes: i,
      totalLocations: this.locations.length
    }), i.length === 0) return [];
    const o = this.locations.filter((a) => {
      const r = be(a);
      return i.includes(r);
    }).map((a) => ({
      value: a.id,
      label: a.name
    }));
    return console.log("[LocationDialog] Valid parents:", o.length, o.map((a) => a.label)), o;
  }
  _includeRootOption() {
    return this._config.type !== "floor" ? !0 : !this.locations.some((e) => e.is_explicit_root);
  }
  _handleValueChanged(e) {
    console.log("[LocationDialog] value-changed received:", e.detail), this._config = { ...this._config, ...e.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      this.location ? (await this.hass.callWS({
        type: "home_topology/locations/update",
        location_id: this.location.id,
        changes: {
          name: this._config.name,
          parent_id: this._config.parent_id || null
        }
      }), await this.hass.callWS({
        type: "home_topology/locations/set_module_config",
        location_id: this.location.id,
        module_id: "_meta",
        config: {
          type: this._config.type
        }
      })) : await this.hass.callWS({
        type: "home_topology/locations/create",
        name: this._config.name,
        parent_id: this._config.parent_id || null,
        meta: {
          type: this._config.type
        }
      }), this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: !0,
        composed: !0
      })), this.open = !1;
    } catch (e) {
      console.error("Failed to save location:", e), this._error = e.message || "Failed to save location";
    } finally {
      this._submitting = !1;
    }
  }
  _handleCancel() {
    console.log("[LocationDialog] Cancel clicked"), this.open = !1, this._handleClosed();
  }
  _handleClosed() {
    console.log("[LocationDialog] Closed event fired"), this.open = !1, this._error = void 0, this._submitting = !1, this._config = {
      name: "",
      type: "area"
    }, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !0,
      composed: !0
    }));
  }
};
bt.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, bt.styles = [
  Ge,
  ke`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let Wt = bt;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Wt);
console.log("[ht-rule-dialog] module loaded");
const ei = class ei extends Y {
  constructor() {
    super(...arguments), this.open = !1, this._config = {}, this._submitting = !1, this._computeLabel = (e) => ({
      name: "Rule Name",
      trigger_type: "Trigger When",
      action_entity_id: "Target Entity",
      action_service: "Action"
    })[e.name] || e.name;
  }
  willUpdate(e) {
    e.has("open") && this.open && (this.rule ? this._config = { ...this.rule } : this._config = {
      id: `rule-${Date.now()}`,
      name: "",
      trigger_type: "occupied",
      action_entity_id: "",
      action_service: "turn_on"
    }, this._error = void 0);
  }
  render() {
    if (!this.open) return _``;
    const e = this._getSchema();
    return _`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${this.rule ? "Edit Rule" : "New Automation Rule"}
      >
        <div class="dialog-content">
          ${this._error ? _`<div class="error-message">${this._error}</div>` : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._getFormData()}
            .schema=${e}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>

          ${this._renderPreview()}
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.rule ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    return [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        name: "trigger_type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "occupied", label: "When Occupied" },
              { value: "vacant", label: "When Vacant" }
            ]
          }
        }
      },
      {
        name: "action_entity_id",
        required: !0,
        selector: {
          entity: {}
        }
      },
      {
        name: "action_service",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "turn_on", label: "Turn On" },
              { value: "turn_off", label: "Turn Off" },
              { value: "toggle", label: "Toggle" }
            ]
          }
        }
      }
    ];
  }
  _getFormData() {
    return {
      name: this._config.name || "",
      trigger_type: this._config.trigger_type || "occupied",
      action_entity_id: this._config.action_entity_id || "",
      action_service: this._config.action_service || "turn_on"
    };
  }
  _handleValueChanged(e) {
    const t = e.detail.value;
    this._config = {
      ...this._config,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service
    };
  }
  _renderPreview() {
    var a, r;
    if (!this._config.name || !this._config.action_entity_id)
      return _``;
    const e = this.hass.states[this._config.action_entity_id], t = (e == null ? void 0 : e.attributes.friendly_name) || this._config.action_entity_id, i = this._config.trigger_type === "occupied" ? "becomes occupied" : "becomes vacant", o = (a = this._config.action_service) == null ? void 0 : a.replace("_", " ");
    return _`
      <div class="preview">
        <div class="preview-label">Preview</div>
        <div class="preview-text">
          When <strong>${((r = this.location) == null ? void 0 : r.name) || "this location"}</strong>
          ${i}, <strong>${o}</strong>
          <strong>${t}</strong>
        </div>
      </div>
    `;
  }
  _isValid() {
    return !!(this._config.name && this._config.trigger_type && this._config.action_entity_id && this._config.action_service);
  }
  async _handleSubmit() {
    var e;
    if (!(!this.location || !this._isValid() || this._submitting)) {
      this._submitting = !0, this._error = void 0;
      try {
        const t = ((e = this.location.modules) == null ? void 0 : e.automation) || { rules: [] }, i = [...t.rules || []], o = {
          id: this._config.id || `rule-${Date.now()}`,
          name: this._config.name,
          trigger_type: this._config.trigger_type,
          action_entity_id: this._config.action_entity_id,
          action_service: this._config.action_service
        };
        if (this.rule) {
          const a = i.findIndex((r) => r.id === this.rule.id);
          a !== -1 && (i[a] = o);
        } else
          i.push(o);
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "automation",
          config: {
            ...t,
            rules: i
          }
        }), this.dispatchEvent(
          new CustomEvent("rule-saved", {
            detail: { rule: o },
            bubbles: !0,
            composed: !0
          })
        ), this.open = !1;
      } catch (t) {
        console.error("Failed to save rule:", t), this._error = t.message || "Failed to save rule";
      } finally {
        this._submitting = !1;
      }
    }
  }
  _handleCancel() {
    this.open = !1;
  }
  _handleClosed() {
    this.open = !1, this.dispatchEvent(
      new CustomEvent("dialog-closed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
};
ei.styles = [
  Ge,
  ke`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .preview {
        padding: 16px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-top: 16px;
        font-size: 14px;
      }

      .preview-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preview-text {
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let qt = ei;
customElements.get("ht-rule-dialog") || customElements.define("ht-rule-dialog", qt);
console.log("[home-topology-panel] module loaded");
var Ci, Oi;
try {
  (Oi = (Ci = import.meta) == null ? void 0 : Ci.hot) == null || Oi.accept(() => window.location.reload());
} catch {
}
const yt = class yt extends Y {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._ruleDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._hasLoaded = !1, this._loadSeq = 0, this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleNewLocation = (e) => {
      e && (e.preventDefault(), e.stopPropagation()), this._showToast("Manage Areas/Floors in Home Assistant Settings", "warning");
    }, this._handleKeyDown = (e) => {
      (e.ctrlKey || e.metaKey) && e.key === "s" && (e.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && (e.preventDefault(), console.log("Undo requested")), (e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "z" && e.shiftKey) && (e.preventDefault(), console.log("Redo requested")), e.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), e.key === "?" && !e.ctrlKey && !e.metaKey && this._showKeyboardShortcutsHelp();
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen;
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (e) => {
      this._logEvent("ui", "source test", e.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    }, console.log("HomeTopologyPanel constructed");
  }
  _enqueueLocationOp(e, t) {
    const o = (this._opQueueByLocationId.get(e) ?? Promise.resolve()).catch(() => {
    }).then(t);
    return this._opQueueByLocationId.set(e, o), o;
  }
  _scheduleReload(e = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(e);
    }, 150);
  }
  willUpdate(e) {
    super.willUpdate(e), !this._hasLoaded && this.hass && (this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations()), e.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), console.log("HomeTopologyPanel connected"), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(e) {
    super.updated(e);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/frontend-patterns.md Section 1.1
   */
  shouldUpdate(e) {
    for (const t of e.keys())
      if (t !== "hass") return !0;
    if (e.has("hass")) {
      const t = e.get("hass");
      return !t || t.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return _`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return _`
        <div class="error-container">
          <h3>Error Loading Home Topology</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const e = this._locations.find(
      (t) => t.id === this._selectedId
    );
    return _`
      <div class="panel-container">
        <div class="panel-left">
          ${this._renderConflictBanner()}
          <div class="header">
            <div class="header-title">Home Topology</div>
            <div class="header-subtitle">
              Locations are synced from Home Assistant Areas/Floors.
              Manage structure in HA Settings; configure behavior here.
            </div>
            <div class="header-actions">
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${!0}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${e ? e.name : "Location Details"}</div>
            <div class="header-subtitle">${e ? e.id : "Select a location to configure modules"}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${e}
            @add-rule=${this._handleAddRule}
            @source-test=${this._handleSourceTest}
          ></ht-location-inspector>
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _renderDialogs() {
    var t, i;
    const e = this._getSelectedLocation();
    return _`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
        .defaultParentId=${(t = this._newLocationDefaults) == null ? void 0 : t.parentId}
        .defaultType=${(i = this._newLocationDefaults) == null ? void 0 : i.type}
        @dialog-closed=${() => {
      console.log("[Panel] Dialog closed event received"), this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>

      <ht-rule-dialog
        .hass=${this.hass}
        .open=${this._ruleDialogOpen}
        .location=${e}
        .rule=${this._editingRule}
        @dialog-closed=${() => {
      this._ruleDialogOpen = !1, this._editingRule = void 0;
    }}
        @rule-saved=${this._handleRuleSaved}
      ></ht-rule-dialog>
    `;
  }
  async _loadLocations(e = !1) {
    const t = ++this._loadSeq, i = e || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      console.log("Calling WebSocket API: home_topology/locations/list"), console.log("hass.callWS available:", typeof this.hass.callWS);
      const o = await Promise.race([
        this.hass.callWS({
          type: "home_topology/locations/list"
        }),
        new Promise(
          (s, c) => setTimeout(() => c(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      console.log("WebSocket result:", o);
      const a = o;
      if (!a || !a.locations)
        throw new Error("Invalid response format: missing locations array");
      if (t !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq: t, current: this._loadSeq });
        return;
      }
      const r = /* @__PURE__ */ new Map();
      for (const s of a.locations) r.set(s.id, s);
      const l = Array.from(r.values());
      l.length !== a.locations.length && console.warn("[Panel] Deduped locations from backend", {
        before: a.locations.length,
        after: l.length
      }), this._locations = [...l], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._locationsVersion += 1, console.log("Loaded locations:", this._locations.length, this._locations), this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), !this._selectedId && this._locations.length > 0 && (this._selectedId = this._locations[0].id);
    } catch (o) {
      console.error("Failed to load locations:", o), this._error = o.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (o == null ? void 0 : o.message) || o);
    } finally {
      this._loading = !1, this.requestUpdate();
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(e) {
    this._selectedId = e.detail.locationId;
  }
  /**
   * Render rename conflict notification banner
   */
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: e, localName: t, haName: i } = this._renameConflict, o = this._locations.find((a) => a.id === e);
    return _`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(o == null ? void 0 : o.name) || e}" was renamed in Home Assistant to "${i}".
            Your local name is "${t}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
  _handleConflictKeepLocal() {
    if (!this._renameConflict) return;
    const { locationId: e, localName: t } = this._renameConflict;
    console.log(`[Panel] Keeping local name "${t}" for location ${e}`), this._renameConflict = void 0;
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: e, haName: t } = this._renameConflict;
    console.log(`[Panel] Accepting HA name "${t}" for location ${e}`);
    const i = this._locations.find((o) => o.id === e);
    i && (i.name = t, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    console.log("[Panel] Dismissing rename conflict"), this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._showToast("Manage Areas/Floors in Home Assistant Settings", "warning");
  }
  _handleLocationEdit(e) {
    e.stopPropagation(), this._showToast("Rename locations in Home Assistant Settings", "warning");
  }
  async _handleLocationMoved(e) {
    e.stopPropagation(), this._showToast("Reparent/reorder in Home Assistant Settings", "warning");
  }
  async _handleLocationRenamed(e) {
    e.stopPropagation(), this._showToast("Rename locations in Home Assistant Settings", "warning");
  }
  async _handleLocationDelete(e) {
    e.stopPropagation(), this._showToast("Delete locations in Home Assistant Settings", "warning");
  }
  async _handleLocationDialogSaved(e) {
    const t = e.detail;
    console.log("Location saved from dialog", t);
    const i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${t.name}"` : `Created "${t.name}"`,
        "success"
      );
    } catch (o) {
      console.error("Failed to reload locations:", o), this._showToast(`Failed to reload: ${o.message}`, "error");
    }
  }
  _handleAddRule() {
    this._editingRule = void 0, this._ruleDialogOpen = !0;
  }
  async _handleRuleSaved(e) {
    const { rule: t } = e.detail;
    console.log("Rule saved", t), this._showToast(`Rule "${t.name}" saved`, "success"), await this._loadLocations(!0), this._ruleDialogOpen = !1, this._editingRule = void 0;
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection)) {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (e) => {
            this._logEvent("ha", "home_topology_updated", (e == null ? void 0 : e.data) || {}), this._scheduleReload(!0);
          },
          "home_topology_updated"
        );
      } catch (e) {
        console.warn("Failed to subscribe to home_topology_updated events", e), this._logEvent("error", "subscribe failed: home_topology_updated", String(e));
      }
      try {
        this._unsubStateChanged = await this.hass.connection.subscribeEvents(
          (e) => {
            var l, s, c, u, d, p;
            const t = (l = e == null ? void 0 : e.data) == null ? void 0 : l.entity_id;
            if (!t) return;
            const i = (s = e == null ? void 0 : e.data) == null ? void 0 : s.new_state, o = (i == null ? void 0 : i.attributes) || {};
            if (t.startsWith("binary_sensor.") && o.device_class === "occupancy" && o.location_id && this._setOccupancyState(o.location_id, (i == null ? void 0 : i.state) === "on"), !this._shouldTrackEntity(t)) return;
            const a = (u = (c = e == null ? void 0 : e.data) == null ? void 0 : c.new_state) == null ? void 0 : u.state, r = (p = (d = e == null ? void 0 : e.data) == null ? void 0 : d.old_state) == null ? void 0 : p.state;
            this._logEvent("ha", "state_changed", { entityId: t, oldState: r, newState: a });
          },
          "state_changed"
        );
      } catch (e) {
        console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (e) => {
            var o, a;
            const t = (o = e == null ? void 0 : e.data) == null ? void 0 : o.location_id, i = (a = e == null ? void 0 : e.data) == null ? void 0 : a.occupied;
            !t || typeof i != "boolean" || (this._setOccupancyState(t, i), this._logEvent("ha", "home_topology_occupancy_changed", { locationId: t, occupied: i }));
          },
          "home_topology_occupancy_changed"
        );
      } catch (e) {
        console.warn("Failed to subscribe to home_topology_occupancy_changed events", e), this._logEvent("error", "subscribe failed: home_topology_occupancy_changed", String(e));
      }
    }
  }
  _setOccupancyState(e, t) {
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [e]: t
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const e = {}, t = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(t)) {
      const a = (o == null ? void 0 : o.attributes) || {};
      if ((a == null ? void 0 : a.device_class) !== "occupancy") continue;
      const r = a.location_id;
      r && (e[r] = (o == null ? void 0 : o.state) === "on");
    }
    return e;
  }
  _renderEventLog() {
    return _`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0 ? _`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (e) => _`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${e.ts}] ${e.type}</div>
                    <div>${e.message}</div>
                    ${e.data !== void 0 ? _`<div class="event-log-meta">${this._safeStringify(e.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(e) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(e) : this._isTrackedEntityInSelectedSubtree(e);
  }
  _isTrackedEntity(e) {
    var i, o;
    const t = /* @__PURE__ */ new Set();
    for (const a of this._locations) {
      for (const l of a.entity_ids || []) t.add(l);
      const r = ((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const l of r) t.add(l.entity_id);
    }
    return t.has(e);
  }
  _isTrackedEntityInSelectedSubtree(e) {
    var i, o;
    const t = this._getSelectedSubtreeLocationIds();
    if (t.size === 0) return !1;
    for (const a of this._locations) {
      if (!t.has(a.id)) continue;
      if ((a.entity_ids || []).includes(e) || (((o = (i = a.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((l) => l.entity_id === e)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const e = /* @__PURE__ */ new Set();
    if (!this._selectedId) return e;
    e.add(this._selectedId);
    let t = !0;
    for (; t; ) {
      t = !1;
      for (const i of this._locations)
        i.parent_id && e.has(i.parent_id) && !e.has(i.id) && (e.add(i.id), t = !0);
    }
    return e;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const e = this._locations.find((i) => i.id === this._selectedId);
    if (!e) return "selected subtree";
    const t = this._getSelectedSubtreeLocationIds().size;
    return `${e.name} subtree (${t} locations)`;
  }
  _safeStringify(e) {
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  _logEvent(e, t, i) {
    const o = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: e,
      message: t,
      data: i
    };
    this._eventLogEntries = [o, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const t = [
      { key: "Ctrl+S", description: "Save pending changes" },
      { key: "Escape", description: "Discard pending changes" },
      { key: "Double-click", description: "Rename location (in tree)" },
      { key: "Drag", description: "Move location (drag handle in tree)" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${t}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((e) => e.id === this._selectedId);
  }
  /**
   * Batch save all pending changes
   * See: docs/frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const e = Array.from(this._pendingChanges.entries()), t = await Promise.allSettled(
      e.map(([o, a]) => this._saveChange(o, a))
    ), i = t.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < t.length ? (this._showToast(`Saved ${t.length - i.length} changes, ${i.length} failed`, "warning"), e.forEach(([o, a], r) => {
      t[r].status === "fulfilled" && this._pendingChanges.delete(o);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(e, t) {
    switch (t.type) {
      case "update":
        await this.hass.callWS({
          type: "home_topology/locations/update",
          location_id: e,
          changes: t.updated
        });
        break;
      case "delete":
        await this.hass.callWS({
          type: "home_topology/locations/delete",
          location_id: e
        });
        break;
      case "create":
        await this.hass.callWS({
          type: "home_topology/locations/create",
          ...t.updated
        });
        break;
    }
  }
  _showToast(e, t = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: e,
        type: t === "error" ? "error" : void 0,
        duration: t === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i), console.log(`[Toast:${t}] ${e}`);
  }
  async _seedDemoData() {
    if (!confirm("This will create a demo topology. Continue?")) return;
    const e = [
      { id: "ground_floor", name: "Ground Floor", type: "floor", parent_id: null },
      { id: "living_room", name: "Living Room", type: "area", parent_id: "ground_floor" },
      { id: "reading_corner", name: "Reading Corner", type: "area", parent_id: "living_room" },
      { id: "kitchen", name: "Kitchen", type: "area", parent_id: "ground_floor" },
      { id: "dining_room", name: "Dining Room", type: "area", parent_id: "ground_floor" },
      { id: "hallway", name: "Hallway", type: "area", parent_id: "ground_floor" },
      { id: "office", name: "Office", type: "area", parent_id: "ground_floor" },
      { id: "garage", name: "Garage", type: "area", parent_id: "ground_floor" },
      { id: "first_floor", name: "First Floor", type: "floor", parent_id: null },
      { id: "master_suite", name: "Master Suite", type: "area", parent_id: "first_floor" },
      { id: "master_bedroom", name: "Master Bedroom", type: "area", parent_id: "master_suite" },
      { id: "master_bath", name: "Master Bath", type: "area", parent_id: "master_suite" },
      { id: "kids_room", name: "Kids Room", type: "area", parent_id: "first_floor" },
      { id: "guest_room", name: "Guest Room", type: "area", parent_id: "first_floor" },
      { id: "outdoor", name: "Outdoor", type: "floor", parent_id: null },
      { id: "patio", name: "Patio", type: "area", parent_id: "outdoor" },
      { id: "garden", name: "Garden", type: "area", parent_id: "outdoor" }
    ];
    try {
      this._loading = !0;
      for (const t of e) {
        console.log(`Creating ${t.name}...`);
        try {
          await this.hass.callWS({
            type: "home_topology/locations/create",
            name: t.name,
            parent_id: t.parent_id,
            meta: { type: t.type }
          });
        } catch (i) {
          console.warn(`Failed to create ${t.name} (might exist):`, i);
        }
      }
      await this._loadLocations(), alert("Demo data seeded successfully!");
    } catch (t) {
      console.error("Seeding failed:", t), alert(`Seeding failed: ${t.message}`);
    } finally {
      this._loading = !1;
    }
  }
};
yt.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  // Internal state
  _locations: { state: !0 },
  _locationsVersion: { state: !0 },
  _selectedId: { state: !0 },
  _loading: { state: !0 },
  _error: { state: !0 },
  _pendingChanges: { state: !0 },
  _saving: { state: !0 },
  _discarding: { state: !0 },
  _locationDialogOpen: { state: !0 },
  _ruleDialogOpen: { state: !0 },
  _editingLocation: { state: !0 },
  _editingRule: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 },
  _occupancyStateByLocation: { state: !0 }
}, yt.styles = [
  Ge,
  ke`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      /* Tree Panel ~40% (min 300px) - from ui-design.md Section 2.1 */
      .panel-left {
        flex: 0 0 40%;
        min-width: 300px;
        max-width: 500px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Responsive - from ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
          min-width: 280px;
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
          min-width: unset;
          max-width: unset;
        }
      }

      /* Header styling - from ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
];
let jt = yt;
if (!customElements.get("home-topology-panel"))
  try {
    console.log("[home-topology-panel] registering custom element"), customElements.define("home-topology-panel", jt);
  } catch (n) {
    console.error("[home-topology-panel] failed to define element", n);
  }
export {
  jt as HomeTopologyPanel
};

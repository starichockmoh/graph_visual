class DisjointSetItem {
  private value;
  private keyCallback;
  // @ts-ignore
  private parent;
  private children;
  /**
   * @param {*} value
   * @param {function(value: *)} [keyCallback]
   */
  // @ts-ignore
  constructor(value, keyCallback) {
    this.value = value;
    this.keyCallback = keyCallback;
    /** @var {DisjointSetItem} this.parent */
    this.parent = null;
    this.children = {};
  }

  /**
   * @return {*}
   */
  getKey() {
    // Allow user to define custom key generator.
    if (this.keyCallback) {
      return this.keyCallback(this.value);
    }

    // Otherwise use value as a key by default.
    return this.value;
  }

  /**
   * @return {DisjointSetItem}
   */
  getRoot() {
    return this.isRoot() ? this : this.parent.getRoot();
  }

  /**
   * @return {boolean}
   */
  isRoot() {
    return this.parent === null;
  }

  /**
   * Rank basically means the number of all ancestors.
   *
   * @return {number}
   */
  getRank() {
    if (this.getChildren().length === 0) {
      return 0;
    }

    let rank = 0;

    /** @var {DisjointSetItem} child */
    // @ts-ignore
    this.getChildren().forEach((child: DisjointSetItem) => {
      // Count child itself.
      rank += 1;

      // Also add all children of current child.
      rank += child.getRank();
    });

    return rank;
  }

  /**
   * @return {DisjointSetItem[]}
   */
  getChildren() {
    return Object.values(this.children);
  }

  /**
   * @param {DisjointSetItem} parentItem
   * @param {boolean} forceSettingParentChild
   * @return {DisjointSetItem}
   */
  // @ts-ignore
  setParent(parentItem, forceSettingParentChild = true) {
    this.parent = parentItem;
    if (forceSettingParentChild) {
      parentItem.addChild(this);
    }

    return this;
  }

  /**
   * @param {DisjointSetItem} childItem
   * @return {DisjointSetItem}
   */
  // @ts-ignore
  addChild(childItem) {
    // @ts-ignore
    this.children[childItem.getKey()] = childItem;
    childItem.setParent(this, false);

    return this;
  }
}
export default class DisjointSet {
  private keyCallback;
  private items;
  /**
   * @param {function(value: *)} [keyCallback]
   */
  // @ts-ignore
  constructor(keyCallback) {
    this.keyCallback = keyCallback;
    this.items = {};
  }

  /**
   * @param {*} itemValue
   * @return {DisjointSet}
   */
  // @ts-ignore
  makeSet(itemValue) {
    const disjointSetItem = new DisjointSetItem(itemValue, this.keyCallback);
    // @ts-ignore
    if (!this.items[disjointSetItem.getKey()]) {
      // Add new item only in case if it not presented yet.
      // @ts-ignore
      this.items[disjointSetItem.getKey()] = disjointSetItem;
    }

    return this;
  }

  /**
   * Find set representation node.
   *
   * @param {*} itemValue
   * @return {(string|null)}
   */
  // @ts-ignore
  find(itemValue) {
    const templateDisjointItem = new DisjointSetItem(
      itemValue,
      this.keyCallback,
    );

    // Try to find item itself;
    // @ts-ignore
    const requiredDisjointItem = this.items[templateDisjointItem.getKey()];

    if (!requiredDisjointItem) {
      return null;
    }

    return requiredDisjointItem.getRoot().getKey();
  }

  /**
   * Union by rank.
   *
   * @param {*} valueA
   * @param {*} valueB
   * @return {DisjointSet}
   */
  // @ts-ignore
  union(valueA, valueB) {
    const rootKeyA = this.find(valueA);
    const rootKeyB = this.find(valueB);

    if (rootKeyA === null || rootKeyB === null) {
      throw new Error('One or two values are not in sets');
    }

    if (rootKeyA === rootKeyB) {
      // In case if both elements are already in the same set then just return its key.
      return this;
    }
    // @ts-ignore
    const rootA = this.items[rootKeyA];
    // @ts-ignore
    const rootB = this.items[rootKeyB];

    if (rootA.getRank() < rootB.getRank()) {
      // If rootB's tree is bigger then make rootB to be a new root.
      rootB.addChild(rootA);

      return this;
    }

    // If rootA's tree is bigger then make rootA to be a new root.
    rootA.addChild(rootB);

    return this;
  }

  /**
   * @param {*} valueA
   * @param {*} valueB
   * @return {boolean}
   */
  // @ts-ignore
  inSameSet(valueA, valueB) {
    const rootKeyA = this.find(valueA);
    const rootKeyB = this.find(valueB);

    if (rootKeyA === null || rootKeyB === null) {
      throw new Error('One or two values are not in sets');
    }

    return rootKeyA === rootKeyB;
  }
}

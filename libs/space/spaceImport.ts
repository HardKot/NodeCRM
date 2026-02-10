import { defaultModuleExtractor, ModuleExtractor } from './moduleExtractor';
import { ISpace } from './ISpace';
import { SourceModuleParser } from './sourceModuleParser';
import { SourceComponentParser } from './sourceComponentParser';
import { SourceMetadataParser } from './sourceMetadataParser';
import { Module } from '../core';

class SpaceImport implements ISpace {
  private source: any;
  private metadataParser = new SourceMetadataParser();
  private componentParser = new SourceComponentParser(this.metadataParser);
  private moduleParser = new SourceModuleParser(this.componentParser);
  private _current: Module | null = null;

  constructor(
    public readonly path: string,
    public readonly extractor: ModuleExtractor = defaultModuleExtractor
  ) {}

  async build() {
    this.source = this.extractor(await import(this.path));
  }

  get current() {
    if (!this._current) {
      this._current = this.moduleParser.parse(this.source);
    }
    return this._current;
  }
}

export { SpaceImport };

# CAT - Callgraph Explorer

<p align="center">
  <img width="300"  src="https://github.com/IdrissRio/CallgraphExplorer/blob/5dec749e56944ea969016e4ab031496ee9898bfc/resources/logo.jpg?raw=true">
</p>

CAT (CallGraph Analysis Tool): Callgraph Explore is an interactive tool for visualising call graphs of Java programs directly in VSCode. 

CAT will look for all the methods in your open Java file. You can then select a method and CAT will open a new tab with the call graph of the selected method.

## Forward and Bacward Callgraph Construction
CAT allows you to construct both forward and backward call graphs. 
The forward call graph is a graph that shows the methods that are called by the selected method. 
The backward call graph is a graph that shows the methods that call the selected method.




## Examples

Let us consider the following Java program saved in a filed called ~/Example.java:

```java
// Example from http://web.cs.ucla.edu/~palsberg/tba/papers/dean-grove-chambers-ecoop95.pdf

public class Example {
  public void main() {
    H h = new H();
    h.m();

    A a = new C();
    a.m();
  }
}

class H extends F {}

class G extends F {}

class F extends C {
  @Override
  void p() {
  }
}

class E extends C {
  @Override
  void m() {
  }
}

class D extends B {
}

class C extends A {
  static { final A G = new G(); }
  @Override
  void m() {
  }
}

class B extends A {
  @Override
  void m() {
  }
}

class A {
  void m() {
  }

  void p() {
  }
}
```

To generate a call graph for this program, we can run the following command:

```bash
java -jar cat.jar ~/Example.java -o ~/Example.json -entryPoint Example main
```

This will generate a call graph in JSON format and save it in a file called ~/Example.json.

To visualise the generated call graph, we can run the following command:

```bash
java -jar cat.jar ~/Example.java  -entryPoint Example main --visualise
```

By visiting `http://localhost:8080` in a web browser, we can view the visualisation of the generated call graph.

<p align="center">
  <img  src="https://raw.githubusercontent.com/idrissrio/cat/main/resources/CallGraphVisualisation.png">
</p>

The user can choose to view the call graph in different formats, such as a tree or a graph
by clicking on the settings icon in the top left corner of the visualisation.

## Contributing

We welcome contributions to CAT! If you'd like to contribute, please follow these steps:

1. Fork the CAT repository.
2. Create a new branch for your feature/fix: git checkout -b feature/your-feature.
3. Commit your changes and push to your forked repository.
4. Create a pull request detailing your changes.

## License
CAT is released under the BSD 3-Clause License.




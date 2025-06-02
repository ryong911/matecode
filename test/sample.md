# Sample Chat Response with Code Blocks

This file contains examples of chat responses with code blocks in various formats for testing purposes.

## Example 1: Simple Code Block with File Path

src/hello.js
```javascript
console.log('Hello, world!');
```

## Example 2: Multiple Code Blocks

app/models/user.rb
```ruby
class User < ApplicationRecord
  validates :email, presence: true
  validates :password, length: { minimum: 8 }
end
```

app/controllers/users_controller.rb
```ruby
class UsersController < ApplicationController
  def index
    @users = User.all
    render json: @users
  end
  
  def show
    @user = User.find(params[:id])
    render json: @user
  end
end
```

## Example 3: No File Path

```python
print('This block has no file path above it and should be ignored')
```

## Example 4: With Language but No Path

The next block has a language specifier but no file path:

```javascript
const x = 42;
console.log(x);
```